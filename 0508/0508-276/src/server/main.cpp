#include "server.h"
#include <iostream>
#include <string>
#include <csignal>

namespace {

vectordb::VectorDBServer* global_server = nullptr;

void signal_handler(int signal) {
  std::cout << "\nReceived signal " << signal << ", shutting down..." << std::endl;
  if (global_server) {
    global_server->Shutdown();
  }
}

}

int main(int argc, char** argv) {
  std::string address = "0.0.0.0:50051";
  std::string data_dir = "./data";

  if (argc > 1) {
    address = argv[1];
  }
  if (argc > 2) {
    data_dir = argv[2];
  }

  std::signal(SIGINT, signal_handler);
  std::signal(SIGTERM, signal_handler);

  vectordb::VectorDBServer server(address, data_dir);
  global_server = &server;

  server.Start();
  server.Wait();

  return 0;
}
