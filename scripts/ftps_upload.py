"""Upload a built site over FTPS to a server that requires TLS session reuse.

usage: python3 ftps_upload.py <local dir> <host> <user>   (password in FTP_PASS)

Infomaniak's FTP server drops a data connection whose TLS session is not the one
of the control connection ("450 Link to file server lost"). Python's ftplib can
reuse that session; the curl shipped with macOS cannot.
"""
import ftplib, os, ssl, sys


class ReusedSessionFTP(ftplib.FTP_TLS):
    def ntransfercmd(self, cmd, rest=None):
        conn, size = ftplib.FTP.ntransfercmd(self, cmd, rest)
        if self._prot_p:
            conn = self.context.wrap_socket(conn, server_hostname=self.host, session=self.sock.session)
        return conn, size


def main(local, host, user):
    ftp = ReusedSessionFTP(host, timeout=60)
    ftp.login(user, os.environ['FTP_PASS'])
    ftp.prot_p()
    files = []
    for root, _, names in os.walk(local):
        for name in names:
            files.append(os.path.relpath(os.path.join(root, name), local))
    # Pages last, the home page very last: a visitor never gets a page whose assets are missing.
    files.sort(key=lambda f: (f == 'index.html', f.endswith('.html'), f))
    made = set()
    for rel in files:
        folder = os.path.dirname(rel)
        parts = folder.split(os.sep) if folder else []
        for i in range(1, len(parts) + 1):
            path = '/'.join(parts[:i])
            if path not in made:
                try: ftp.mkd(path)
                except ftplib.error_perm: pass
                made.add(path)
        with open(os.path.join(local, rel), 'rb') as handle:
            ftp.storbinary('STOR ' + rel.replace(os.sep, '/'), handle)
    # Remove the hashed bundles of previous versions.
    current = set(os.listdir(os.path.join(local, 'assets')))
    for name in ftp.nlst('assets'):
        base = name.split('/')[-1]
        if base.startswith('index-') and base.endswith(('.js', '.css')) and base not in current:
            ftp.delete('assets/' + base)
    ftp.quit()
    print(f'{len(files)} fichiers envoyés')


if __name__ == '__main__':
    main(*sys.argv[1:4])
