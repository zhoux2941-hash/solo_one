#pragma once

#include <string>
#include <cstdint>
#include <cstddef>

namespace vectordb {

class MMapStorage {
public:
  MMapStorage();
  ~MMapStorage();

  bool Open(const std::string& path, size_t size, bool read_only = false);
  void Close();
  bool Sync();

  void* Data() const { return data_; }
  size_t Size() const { return size_; }
  bool IsOpen() const { return data_ != nullptr; }

  bool Resize(size_t new_size);

private:
  int fd_;
  void* data_;
  size_t size_;
  std::string path_;
  bool read_only_;
};

}
