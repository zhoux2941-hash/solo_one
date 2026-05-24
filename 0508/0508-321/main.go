package main

import (
	"flag"
	"log"
	"net/http"
	"webtransport-spreadsheet/server"
)

func main() {
	useTLS := flag.Bool("tls", false, "Use HTTPS with self-signed certificate")
	httpAddr := flag.String("http", ":8080", "HTTP listen address")
	httpsAddr := flag.String("https", ":8443", "HTTPS listen address")
	flag.Parse()

	roomManager := server.NewRoomManager()
	wtServer := server.NewWebTransportServer(roomManager)

	http.HandleFunc("/webtransport", wtServer.HandleWebTransport)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	if *useTLS {
		log.Printf("HTTPS server starting on %s...", *httpsAddr)
		log.Printf("Please visit https://localhost%s", *httpsAddr)
		if err := http.ListenAndServeTLS(*httpsAddr, "cert.pem", "key.pem", nil); err != nil {
			log.Fatalf("HTTPS server failed: %v", err)
		}
	} else {
		log.Printf("HTTP server starting on %s...", *httpAddr)
		log.Println("WARNING: WebTransport requires HTTPS.")
		log.Println("For full functionality, generate certificates and run: go run main.go -tls")
		if err := http.ListenAndServe(*httpAddr, nil); err != nil {
			log.Fatalf("HTTP server failed: %v", err)
		}
	}
}
