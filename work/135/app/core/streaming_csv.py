import csv
import io
from typing import Iterator, Dict, Any, Optional, List, Tuple
from fastapi import UploadFile
import logging

from config import settings

logger = logging.getLogger(__name__)


class StreamingCSVParser:
    def __init__(
        self,
        chunk_size: int = 10 * 1024 * 1024,
        encoding: str = 'utf-8-sig',
        delimiter: str = ','
    ):
        self.chunk_size = chunk_size
        self.encoding = encoding
        self.delimiter = delimiter
        self._buffer = ''
        self._headers = None
        self._row_count = 0
    
    def _split_on_newline(self, data: str) -> Tuple[str, str]:
        if '\r\n' in data:
            lines = data.split('\r\n')
            return '\r\n'.join(lines[:-1]), lines[-1]
        elif '\n' in data:
            lines = data.split('\n')
            return '\n'.join(lines[:-1]), lines[-1]
        else:
            return '', data
    
    def parse_file(self, file: UploadFile) -> Iterator[Dict[str, Any]]:
        self._buffer = ''
        self._headers = None
        self._row_count = 0
        
        try:
            while True:
                chunk = file.file.read(self.chunk_size)
                if not chunk:
                    break
                
                if isinstance(chunk, bytes):
                    try:
                        chunk_str = chunk.decode(self.encoding)
                    except UnicodeDecodeError:
                        chunk_str = chunk.decode('latin-1', errors='replace')
                else:
                    chunk_str = chunk
                
                self._buffer += chunk_str
                
                complete_lines, remaining = self._split_on_newline(self._buffer)
                self._buffer = remaining
                
                if complete_lines:
                    for row in self._parse_lines(complete_lines):
                        yield row
            
            if self._buffer:
                for row in self._parse_lines(self._buffer):
                    yield row
                    
        except Exception as e:
            logger.error(f"Error during streaming parse: {e}")
            raise
    
    def _parse_lines(self, lines_str: str) -> Iterator[Dict[str, Any]]:
        if not lines_str:
            return
        
        try:
            csv_reader = csv.DictReader(
                io.StringIO(lines_str),
                delimiter=self.delimiter,
                fieldnames=self._headers
            )
            
            if self._headers is None:
                try:
                    first_row = next(csv_reader)
                    self._headers = list(first_row.keys())
                    self._row_count = 1
                    yield {k.strip(): v for k, v in first_row.items()}
                except StopIteration:
                    return
            
            for row in csv_reader:
                self._row_count += 1
                yield {k.strip(): v for k, v in row.items()}
                
        except Exception as e:
            logger.error(f"Error parsing lines: {e}")
            raise
    
    def get_current_row_count(self) -> int:
        return self._row_count
    
    def get_headers(self) -> Optional[List[str]]:
        return self._headers


def validate_csv_headers(headers: Optional[List[str]], required: List[str]) -> Tuple[bool, List[str]]:
    if not headers:
        return False, ['No headers found in CSV']
    
    missing = []
    for req in required:
        if req not in headers:
            missing.append(req)
    
    return len(missing) == 0, missing


def create_streaming_parser() -> StreamingCSVParser:
    return StreamingCSVParser(
        chunk_size=settings.CSV_CHUNK_SIZE,
        encoding='utf-8-sig'
    )
