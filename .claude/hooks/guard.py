#!/usr/bin/env python3
"""PreToolUse koruma kancası (Write, Edit, MultiEdit, NotebookEdit, Bash ve repoya doğrudan
yazan GitHub araçları).

1. ŞİFRE ENGELİ: yazılacak içerikte veya komutta şifreye benzeyen bir değer varsa
   işlemi durdurur (çıkış kodu 2). Değer ekrana basılmaz, yalnızca türü söylenir.
2. ANA SAYFA ONAYI: index.html değiştirilmeden önce sahibin onayını sorar
   (permissionDecision: "ask"). Kanonik tasarım kuralı, CLAUDE.md madde 4.

Kanca bir güvenlik ağıdır, tam koruma değildir: kabuk komutlarıyla yapılan her yazmayı
yakalayamaz. Kendi hatasında işlemi engellemez (fail open), yalnızca şifre bulunca engeller.
"""
import base64
import json
import os
import re
import sys

SECRET_PATTERNS = [
    ('özel anahtar (private key)', re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----')),
    ('Google servis hesabı anahtarı', re.compile(r'"private_key_id"\s*:\s*"[0-9a-f]{20,}"')),
    ('panel parola özeti (ADMIN_PASS_HASH)', re.compile(r'pbkdf2\$\d{5,7}\$[A-Za-z0-9_-]{16,}\$[A-Za-z0-9_-]{40,}')),
    ('oturum anahtarı (ADMIN_SESSION_SECRET)', re.compile(
        r'ADMIN_SESSION_SECRET\s*[=:]\s*["\']?(?=[A-Za-z0-9_-]{40,})(?=[^"\'\s]*[0-9])(?=[^"\'\s]*[A-Z])(?=[^"\'\s]*[a-z])[A-Za-z0-9_-]{40,}')),
    ('rapor anahtarı (REPORT_TOKEN)', re.compile(
        r'REPORT_TOKEN\s*[=:]\s*["\']?(?=[A-Za-z0-9_-]{24,})(?=[^"\'\s]*[0-9])(?=[^"\'\s]*[A-Za-z])[A-Za-z0-9_-]{24,}')),
    ('Resend API anahtarı', re.compile(r'\bre_[A-Za-z0-9]{8,}_[A-Za-z0-9_]{16,}')),
    ('GitHub belirteci', re.compile(r'\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})')),
    ('Google API anahtarı', re.compile(r'\bAIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])')),          # sonda tire olabilir; \b yetmez
    ('AWS erişim anahtarı', re.compile(r'\bAKIA[0-9A-Z]{16}\b')),
    ('Cloudflare API belirteci', re.compile(r'(?i)CLOUDFLARE_API_TOKEN\s*[=:]\s*["\']?[A-Za-z0-9_-]{40}')),
    # base64 servis hesabı JSON (GSC_SA_KEY_B64) ve base64 "PRIVATE KEY": imzalar aşağıda,
    # çalışma anında düz metinden üretilir (kaynakta base64 imza yazılırsa kanca kendi dosyasını engeller)
    ('GSC_SA_KEY değeri', re.compile(r'GSC_SA_KEY(?:_B64)?["\']?\s*[=:]\s*["\']?[A-Za-z0-9+/]{200,}')),
    # düz metin Bearer belirteçleri (REPORT_TOKEN "Authorization: Bearer <hex>" ile gider)
    ('Bearer belirteci', re.compile(
        r'(?i)\bBearer\s+(?=[A-Za-z0-9._~+/=-]{24,})(?=[^\s"\']*[0-9])(?=[^\s"\']*[A-Za-z])[A-Za-z0-9._~+/=-]{24,}')),
    # isimli sırlar: tırnaklı JSON/YAML anahtarı, markdown tablo hücresi, standart base64 değer
    ('isimli sır (JSON/YAML/tablo)', re.compile(
        r'(?:ADMIN_SESSION_SECRET|REPORT_TOKEN|CLOUDFLARE_API_TOKEN|RESEND_API_KEY)["\']?\s*[=:|]\s*[`"\']?'
        r'(?=[A-Za-z0-9_+/=-]{24,})(?=[^"\'`\s|]*[0-9])(?=[^"\'`\s|]*[A-Za-z])[A-Za-z0-9_+/=-]{24,}')),
]


def b64_signatures(plain):
    """Düz metnin base64 kodlanmış bir metnin içinde, üç bayt hizalamasının hepsinde aldığı
    değişmez parçaları döndürür (önündeki ve arkasındaki baytlardan etkilenmeyen karakterler)."""
    sigs = []
    for k in range(3):
        enc = base64.b64encode(b'\0' * k + plain).decode().rstrip('=')
        start = (8 * k + 5) // 6
        end = (8 * (k + len(plain))) // 6
        sigs.append(re.escape(enc[start:end]))
    return sigs


_B64_PLAINS = [b'"type": "service' + b'_account"', b'"type":"service' + b'_account"', b'PRIVATE ' + b'KEY-----']
SECRET_PATTERNS.append(('Google servis hesabı / özel anahtar (base64)',
                        re.compile('|'.join(s for p in _B64_PLAINS for s in b64_signatures(p)))))


def index_write_rx(project):
    """Hedef yalnızca repo kökündeki index.html; adı index.html ile biten her yol değil."""
    target = (r'["\']?(?:\./|(?:\$CLAUDE_PROJECT_DIR|\$\{CLAUDE_PROJECT_DIR\}|'
              + re.escape(project.rstrip('/')) + r')/)?index\.html["\']?(?=$|[\s|;&)<>])')
    parts = [
        r'(?<![=-])>>?\|?\s*' + target,                                              # > >> >| (not => or ->)
        r'\btee\b(?:\s+-{1,2}[a-z]+)*\s+' + target,                                  # tee, tee -a, tee --append
        r'\bsed\b[^|;&]*\s(?:-[a-zA-Z]*i[a-zA-Z.]*|--in-place\S*)(?=\s)[^|;&]*\s' + target,  # -i anywhere
        r'\bperl\b[^|;&]*\s-[a-zA-Z]*i[^|;&]*\s' + target,                          # perl -pi
        r'\b(?:cp|mv|install|rsync)\b[^|;&]*\s' + target + r'\s*(?:\d?>\S*\s*)?(?:$|[|;&])',
        r'\b(?:cp|mv|rsync)\b[^|;&]*\S*index\.html["\']?\s+["\']?\./?["\']?\s*(?:$|[|;&])',  # cp x/index.html .
        r'\btruncate\b[^|;&]*\s' + target,
        r'\bgit\s+checkout\s+(?!--)\S+\s+--\s+' + target,                           # git checkout <ref> -- index.html
        r'\bgit\s+restore\b[^|;&]*--source[^|;&]*\s' + target,
        r'open\(\s*["\'](?:\./)?index\.html["\']\s*,\s*["\'][wax]',                 # python open('index.html','w')
    ]
    return re.compile('|'.join(parts))


def texts(tool, inp):
    if tool == 'Bash':
        return [inp.get('command', '')]
    out = [inp.get('content', ''), inp.get('new_string', ''), inp.get('new_source', ''),
           inp.get('body', ''), inp.get('message', '')]   # GitHub yorum, PR ve commit metinleri
    for e in inp.get('edits', []) or []:
        out.append(e.get('new_string', ''))
    for f in inp.get('files', []) or []:          # mcp__github__push_files
        out.append(f.get('content', ''))
    return [t for t in out if isinstance(t, str) and t]


def is_homepage(path, project):
    if not path:
        return False
    p = os.path.realpath(path if os.path.isabs(path) else os.path.join(project, path))
    return p == os.path.realpath(os.path.join(project, 'index.html'))


def ask(reason):
    # ensure_ascii varsayılan: UTF-8 olmayan konsol (Windows cp1252) onay yolunu çökertmesin
    print(json.dumps({'hookSpecificOutput': {
        'hookEventName': 'PreToolUse',
        'permissionDecision': 'ask',
        'permissionDecisionReason': reason,
    }}))
    sys.exit(0)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        sys.exit(0)
    if not isinstance(data, dict):
        sys.exit(0)
    tool = data.get('tool_name', '')
    inp = data.get('tool_input', {}) or {}
    project = os.environ.get('CLAUDE_PROJECT_DIR') or data.get('cwd') or os.getcwd()

    for t in texts(tool, inp):
        for name, rx in SECRET_PATTERNS:
            if rx.search(t):
                print(f'ENGELLENDİ: içerikte {name} biçiminde bir değer var. Sırlar repoya, '
                      'dosyaya veya komut satırına yazılmaz; yalnızca Cloudflare/GitHub şifreli '
                      'alanlarına veya bulut ortamı secret\'larına girilir (CLAUDE.md madde 5). '
                      'Değer gerçekse yeniden üretilmeli.', file=sys.stderr)
                sys.exit(2)

    reason = ('Ana sayfa (index.html) kanonik tasarım: değişiklik için sahibin bu konuşmadaki '
              'açık onayı gerekir (CLAUDE.md madde 4). Onay yoksa önce önizleme hazırlayın.')
    path = inp.get('file_path') or inp.get('notebook_path') or inp.get('path')
    # Yalnızca yazan araçlar: GitHub'dan index.html okumak (get_file_contents, list_commits) onay istemez
    writes = ('Write', 'Edit', 'MultiEdit', 'NotebookEdit', 'mcp__github__create_or_update_file',
              'mcp__github__push_files', 'mcp__github__delete_file')
    if tool in writes and is_homepage(path, project):
        ask(reason)
    for f in inp.get('files', []) or []:
        if is_homepage(f.get('path'), project):
            ask(reason)
    if tool == 'Bash' and index_write_rx(project).search(inp.get('command', '')):
        ask(reason + ' Komut index.html dosyasına yazıyor görünüyor.')
    sys.exit(0)


if __name__ == '__main__':
    main()
