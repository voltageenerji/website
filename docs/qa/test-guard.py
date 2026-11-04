"""PreToolUse koruma kancası testleri: python3 -I docs/qa/test-guard.py"""
import json, os, subprocess, sys, secrets, base64

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOOK = os.path.join(ROOT, '.claude', 'hooks', 'guard.py')
ok_n = fail_n = 0

def run(tool, inp, raw=None):
    env = dict(os.environ, CLAUDE_PROJECT_DIR=ROOT)
    payload = raw if raw is not None else json.dumps({'tool_name': tool, 'tool_input': inp, 'cwd': ROOT})
    p = subprocess.run([sys.executable, '-I', HOOK], input=payload, capture_output=True, text=True, env=env)
    decision = None
    if p.stdout.strip():
        decision = json.loads(p.stdout)['hookSpecificOutput']['permissionDecision']
    return p.returncode, decision, p.stderr

def check(name, cond):
    global ok_n, fail_n
    if cond: ok_n += 1
    else: fail_n += 1; print('FAIL', name)

# Ana sayfa onayı
check('index.html Write → ask', run('Write', {'file_path': os.path.join(ROOT, 'index.html'), 'content': 'x'})[1] == 'ask')
check('index.html Edit (göreli yol) → ask', run('Edit', {'file_path': 'index.html', 'old_string': 'a', 'new_string': 'b'})[1] == 'ask')
check('rehber sayfası Edit → serbest', run('Edit', {'file_path': os.path.join(ROOT, 'rehber/sktt.html'), 'old_string': 'a', 'new_string': 'b'}) == (0, None, ''))
check('docs/design/index.html → serbest', run('Write', {'file_path': os.path.join(ROOT, 'docs/design/index.html'), 'content': 'x'})[1] is None)
for cmd, exp in [
    ('python3 build.py > index.html', 'ask'), ('cat a >> ./index.html', 'ask'), ("sed -i 's/a/b/' index.html", 'ask'),
    ('cp /tmp/new.html index.html', 'ask'), ('echo x | tee index.html', 'ask'), ('truncate -s 0 index.html', 'ask'),
    ('grep -n foo index.html > /tmp/out.txt', None), ("sed -n '1,5p' index.html", None), ('cp index.html /tmp/yedek.html', None),
    ('git checkout -- index.html', None), ('git diff --stat -- index.html', None), ('wc -l index.html', None),
]:
    check(f'Bash {cmd!r} → {exp}', run('Bash', {'command': cmd})[1] == exp)

# Şifre engeli
sess = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip('=')
for name, text in [
    # Sahte değerler parça parça kurulur: test dosyasının kendisi kancaya takılmasın.
    ('private key', '-----BEGIN ' + 'PRIVATE KEY-----\nMIIE\n-----END ' + 'PRIVATE KEY-----'),
    ('servis hesabı JSON', '{"type": "service_account", "private_key_id": "' + '0123456789abcdef' * 3 + '"}'),
    ('pbkdf2 özeti', 'ADMIN_PASS_HASH = pbkdf2$210000$' + 'A' * 22 + '$' + 'b1C' * 15),
    ('oturum anahtarı', f'ADMIN_SESSION_SECRET={sess}Ab1'),
    ('Resend', 'RESEND_API_KEY=re_AbCdEf12_' + 'x9Y' * 8),
    ('GitHub', 'token ghp_' + 'a1B2' * 9),
    ('Google API', 'key=AIza' + 'Sy' + 'x' * 33),
]:
    rc, dec, err = run('Write', {'file_path': os.path.join(ROOT, 'notes.md'), 'content': text})
    check(f'şifre engeli: {name} (Write)', rc == 2 and 'ENGELLENDİ' in err)
    check(f'şifre engeli: {name} değer basılmıyor', text.splitlines()[0][-12:] not in err)
rc, _, _ = run('Bash', {'command': 'echo "RESEND_API_KEY=re_AbCdEf12_' + 'x9Y' * 8 + '" > .env'})
check('şifre engeli: Bash komutu', rc == 2)
rc, _, _ = run('Edit', {'file_path': os.path.join(ROOT, 'x.md'), 'old_string': 'a', 'new_string': '-----BEGIN RSA ' + 'PRIVATE KEY-----'})
check('şifre engeli: Edit new_string', rc == 2)

# Yanlış pozitif yok: test sahte değerleri ve repodaki her metin dosyası
for t in ["ADMIN_SESSION_SECRET: 'panel-testi-oturum-anahtari'", "REPORT_TOKEN: 'sekret-token'", 'ADMIN_PASS_HASH ve ADMIN_SESSION_SECRET "Encrypt" seçeneğiyle kaydedilmeli.']:
    check(f'yanlış pozitif yok: {t[:40]}', run('Write', {'file_path': os.path.join(ROOT, 'n.md'), 'content': t})[0] == 0)
files = subprocess.run(['git', 'ls-files'], cwd=ROOT, capture_output=True, text=True).stdout.split()
files += ['.claude/hooks/guard.py', '.claude/settings.json', 'docs/qa/test-guard.py']
blocked = []
for f in files:
    path = os.path.join(ROOT, f)
    if not os.path.isfile(path) or os.path.getsize(path) > 2_000_000: continue
    try: content = open(path, encoding='utf-8').read()
    except UnicodeDecodeError: continue
    if run('Write', {'file_path': os.path.join(ROOT, 'tmp-' + os.path.basename(f)), 'content': content})[0] == 2:
        blocked.append(f)
check(f'repodaki {len(files)} dosyanın hiçbiri engellenmiyor {blocked}', not blocked)

# Bozuk girdi engellemez
check('bozuk JSON → serbest', run(None, None, raw='{bozuk')[0] == 0)

print(f'\n{ok_n} passed, {fail_n} failed')
sys.exit(1 if fail_n else 0)
