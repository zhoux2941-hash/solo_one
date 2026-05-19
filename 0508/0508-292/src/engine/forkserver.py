import os
import subprocess
import signal
import time
import gc
from typing import Optional, Tuple


class ForkServer:
    def __init__(self, target_path: str, timeout: int = 5, mem_limit: int = 1024):
        self.target_path = target_path
        self.timeout = timeout
        self.mem_limit = mem_limit
        self.process: Optional[subprocess.Popen] = None
        self._stdin = None
        self._stdout = None
        self._stderr = None
    
    def spawn_target(self, input_data: bytes, shm_name: str) -> Tuple[int, float, bool, Optional[str]]:
        start_time = time.time()
        timed_out = False
        crash = False
        error_msg = None
        return_code = 0
        
        env = os.environ.copy()
        env['__AFL_SHM_ID'] = shm_name
        
        preexec_fn = None
        if os.name == 'posix':
            def _preexec():
                os.setpgrp()
                import resource
                resource.setrlimit(resource.RLIMIT_AS, (self.mem_limit * 1024 * 1024, self.mem_limit * 1024 * 1024))
                resource.setrlimit(resource.RLIMIT_CPU, (self.timeout + 1, self.timeout + 2))
            preexec_fn = _preexec
        
        try:
            self.process = subprocess.Popen(
                [self.target_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                preexec_fn=preexec_fn,
                close_fds=True if os.name == 'posix' else False
            )
            
            self._stdin = self.process.stdin
            self._stdout = self.process.stdout
            self._stderr = self.process.stderr
            
            stdout, stderr = self.process.communicate(
                input=input_data,
                timeout=self.timeout
            )
            
            return_code = self.process.returncode
            
            if self._is_crash(return_code):
                crash = True
                error_msg = stderr.decode('utf-8', errors='ignore')[:1000]
            
        except subprocess.TimeoutExpired:
            timed_out = True
            return_code = -1
            self._force_cleanup()
            
        except MemoryError:
            return_code = -3
            error_msg = "Memory limit exceeded in fuzzer process"
            self._force_cleanup()
            
        except Exception as e:
            return_code = -2
            error_msg = str(e)
            self._force_cleanup()
        
        finally:
            self._close_pipes()
            self._cleanup_process()
            gc.collect()
        
        elapsed = time.time() - start_time
        
        return return_code, elapsed, crash or timed_out, error_msg
    
    def _is_crash(self, return_code: int) -> bool:
        if os.name == 'posix':
            return return_code < 0 or (return_code & 0x7f) != 0
        else:
            return return_code != 0 and return_code != 1
    
    def _close_pipes(self):
        for pipe in [self._stdin, self._stdout, self._stderr]:
            if pipe:
                try:
                    pipe.close()
                except:
                    pass
        self._stdin = None
        self._stdout = None
        self._stderr = None
    
    def _kill_process(self):
        if self.process:
            try:
                if os.name == 'posix':
                    try:
                        os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                    except:
                        pass
                self.process.kill()
                self.process.wait(timeout=0.5)
            except:
                try:
                    self.process.terminate()
                    self.process.wait(timeout=0.5)
                except:
                    pass
    
    def _force_cleanup(self):
        if self.process:
            try:
                if self.process.poll() is None:
                    self._kill_process()
            except:
                pass
    
    def _cleanup_process(self):
        self._kill_process()
        self.process = None
    
    def cleanup(self):
        self._force_cleanup()
        self._close_pipes()
        self.process = None
        gc.collect()
