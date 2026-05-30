import http.server
import mimetypes

mimetypes.add_type('text/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('text/html', '.html')

PORT = 8090
handler = http.server.SimpleHTTPRequestHandler
handler.extensions_map.update({
    '.js': 'text/javascript',
    '.mjs': 'text/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
})

with http.server.HTTPServer(("", PORT), handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
