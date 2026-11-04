#!/usr/bin/env python3
"""PreToolUse koruma kancası (Write, Edit, MultiEdit, NotebookEdit, Bash).

1. ŞİFRE ENGELİ: yazılacak içerikte veya komutta şifreye benzeyen bir değer varsa
   işlemi durdurur (çıkış kodu 2). Değer ekrana basılmaz, yalnızca türü söylenir.
2. ANA SAYFA ONAYI: index.html değiştirilmeden önce sahibin onayını sorar
   (permissionDecision: "ask"). Kanonik tasarım kuralı, CLAUDE.md madde 4.

Kanca bir güvenlik ağıdır, tam koruma değildir: kabuk komutlarıyla yapılan her yazmayı
yakalayamaz. Kendi hatasında işlemi engellemez (fail open), yalnızca şifre bulunca engeller.
"""
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
    ('Google API anahtarı', re.compile(r'\bAIza[0-9A-Za-z_-]{35}\b')),
    ('AWS erişim anahtarı', re.compile(r'\bAKIA[0-9A-Z]{16}\b')),
    ('Cloudflare API belirteci', re.compile(r'(?i)CLOUDFLARE_API_TOKEN\s*[=:]\s*["\']?[A-Za-z0-9_-]{40}')),
]

# index.html'e kabukta yazma kalıpları: yönlendirme, tee, sed -i, cp/mv hedefi, truncate
INDEX_WRITE = re.compile(
    r'(?:>>?|\btee\b(?:\s+-a)?)\s*\S*index\.html\b'
    r'|\bsed\s+(?:-[a-zA-Z]*i[a-zA-Z]*|--in-place)\b[^|;&]*\bindex\.html\b'
    r'|\b(?:cp|mv|install)\b[^|;&]*\s\S*index\.html\s*(?:$|[|;&])'
    r'|\btruncate\b[^|;&]*\bindex\.html\b'
)


def texts(tool, inp):
    if tool == 'Bash':
        return [inp.get('command', '')]
    out = [inp.get('content', ''), inp.get('new_string', ''), inp.get('new_source', '')]
    for e in inp.get('edits', []) or []:
        out.append(e.get('new_string', ''))
    return [t for t in out if isinstance(t, str) and t]


def is_homepage(path, project):
    if not path:
        return False
    p = os.path.realpath(path if os.path.isabs(path) else os.path.join(project, path))
    return p == os.path.realpath(os.path.join(project, 'index.html'))


def ask(reason):
    print(json.dumps({'hookSpecificOutput': {
        'hookEventName': 'PreToolUse',
        'permissionDecision': 'ask',
        'permissionDecisionReason': reason,
    }}, ensure_ascii=False))
    sys.exit(0)


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
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
    if tool in ('Write', 'Edit', 'MultiEdit', 'NotebookEdit') and is_homepage(inp.get('file_path') or inp.get('notebook_path'), project):
        ask(reason)
    if tool == 'Bash' and INDEX_WRITE.search(inp.get('command', '')):
        ask(reason + ' Komut index.html dosyasına yazıyor görünüyor.')
    sys.exit(0)


if __name__ == '__main__':
    main()
