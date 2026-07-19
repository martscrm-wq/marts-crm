import http.server
import json
import urllib.request
import urllib.error
import os
import sys

PORT = 8000
DEEPSEEK_URL = 'https://api.deepseek.com'

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/proxy/deepseek/chat/completions':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            api_key = self.headers.get('X-Api-Key', '')
            try:
                req = urllib.request.Request(
                    DEEPSEEK_URL + '/chat/completions',
                    data=body,
                    headers={
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + api_key
                    },
                    method='POST'
                )
                with urllib.request.urlopen(req, timeout=60) as resp:
                    data = resp.read()
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(data)
            except urllib.error.HTTPError as e:
                err_body = e.read()
                self.send_response(e.code)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(err_body)
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({'error': {'message': str(e)}}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key')
        self.end_headers()

    def do_GET(self):
        if self.path == '/' or self.path == '':
            self.path = '/Marts_System_Merged.html'
        super().do_GET()

    def log_message(self, format, *args):
        print(f"[Server] {args[0]}")

os.chdir(os.path.dirname(os.path.abspath(__file__)))
print(f"Marts System Server running at http://localhost:{PORT}")
print(f"Open http://localhost:{PORT}/ in your browser")
print("Press Ctrl+C to stop\n")
http.server.HTTPServer(('0.0.0.0', PORT), ProxyHandler).serve_forever()
