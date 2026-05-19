#include "mmap_storage.h"
#include <stdexcept>
#include <cstring>

#ifdef _WIN32
#include <windows.h>
#include <io.h>
#include <fcntl.h>
#else
#include <sys/mman.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#endif

namespace vectordb {

#ifdef _WIN32

MMapStorage::MMapStorage() : fd_(INVALID_HANDLE_VALUE), data_(nullptr), size_(0), read_only_(false) {}

MMapStorage::~MMapStorage() {
  Close();
}

bool MMapStorage::Open(const std::string& path, size_t size, bool read_only) {
  if (IsOpen()) {
    Close();
  }

  path_ = path;
  size_ = size;
  read_only_ = read_only;

  DWORD access = read_only ? GENERIC_READ : (GENERIC_READ | GENERIC_WRITE);
  DWORD share_mode = FILE_SHARE_READ | FILE_SHARE_WRITE;
  DWORD creation_disposition = OPEN_ALWAYS;
  DWORD flags_attr = FILE_ATTRIBUTE_NORMAL;

  HANDLE hfile = CreateFileA(path.c_str(), access, share_mode, nullptr, creation_disposition, flags_attr, nullptr);
  if (hfile == INVALID_HANDLE_VALUE) {
    return false;
  }

  LARGE_INTEGER file_size;
  GetFileSizeEx(hfile, &file_size);
  if (file_size.QuadPart < static_cast<LONGLONG>(size)) {
    LARGE_INTEGER new_size;
    new_size.QuadPart = size;
    SetFilePointerEx(hfile, new_size, nullptr, FILE_BEGIN);
    SetEndOfFile(hfile);
  }

  DWORD protect = read_only ? PAGE_READONLY : PAGE_READWRITE;
  HANDLE hmap = CreateFileMappingA(hfile, nullptr, protect, 0, 0, nullptr);
  if (hmap == nullptr) {
    CloseHandle(hfile);
    return false;
  }

  DWORD map_access = read_only ? FILE_MAP_READ : FILE_MAP_ALL_ACCESS;
  data_ = MapViewOfFile(hmap, map_access, 0, 0, size);
  CloseHandle(hmap);
  CloseHandle(hfile);

  return data_ != nullptr;
}

void MMapStorage::Close() {
  if (data_) {
    UnmapViewOfFile(data_);
    data_ = nullptr;
  }
  size_ = 0;
}

bool MMapStorage::Sync() {
  if (!data_) return false;
  return FlushViewOfFile(data_, size_) != 0;
}

bool MMapStorage::Resize(size_t new_size) {
  if (!data_) return false;
  Close();
  return Open(path_, new_size, read_only_);
}

#else

MMapStorage::MMapStorage() : fd_(-1), data_(nullptr), size_(0), read_only_(false) {}

MMapStorage::~MMapStorage() {
  Close();
}

bool MMapStorage::Open(const std::string& path, size_t size, bool read_only) {
  if (IsOpen()) {
    Close();
  }

  path_ = path;
  size_ = size;
  read_only_ = read_only;

  int flags = read_only ? O_RDONLY : O_RDWR;
  fd_ = open(path.c_str(), flags | O_CREAT, 0644);
  if (fd_ == -1) {
    return false;
  }

  struct stat st;
  if (fstat(fd_, &st) == -1) {
    close(fd_);
    fd_ = -1;
    return false;
  }

  if (static_cast<size_t>(st.st_size) < size) {
    if (ftruncate(fd_, size) == -1) {
      close(fd_);
      fd_ = -1;
      return false;
    }
  }

  int prot = read_only ? PROT_READ : (PROT_READ | PROT_WRITE);
  data_ = mmap(nullptr, size, prot, MAP_SHARED, fd_, 0);
  close(fd_);
  fd_ = -1;

  return data_ != MAP_FAILED;
}

void MMapStorage::Close() {
  if (data_ && data_ != MAP_FAILED) {
    munmap(data_, size_);
    data_ = nullptr;
  }
  size_ = 0;
}

bool MMapStorage::Sync() {
  if (!data_ || data_ == MAP_FAILED) return false;
  return msync(data_, size_, MS_SYNC) == 0;
}

bool MMapStorage::Resize(size_t new_size) {
  if (!data_ || data_ == MAP_FAILED) return false;
  Close();
  return Open(path_, new_size, read_only_);
}

#endif

}
