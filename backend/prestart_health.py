#!/usr/bin/env python3
"""
Pre-start health check server
Responde health checks IMEDIATAMENTE, mesmo antes do FastAPI iniciar
"""
import http.server
import socketserver
import sys
import os

PORT = 8001

class HealthCheckHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ['/healthz', '/health', '/']:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(b'{"status":"ok","prestart":true}')
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_HEAD(self):
        if self.path in ['/healthz', '/health', '/']:
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        # Silenciar logs
        pass

if __name__ == "__main__":
    Handler = HealthCheckHandler
    
    # Tentar bind na porta 8001
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
            print(f"Pre-start health server running on port {PORT}", file=sys.stderr)
            httpd.serve_forever()
    except OSError as e:
        # Porta já em uso (FastAPI já iniciou) - tudo bem
        print(f"Port {PORT} in use - FastAPI already running", file=sys.stderr)
        sys.exit(0)
