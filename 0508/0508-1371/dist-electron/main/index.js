var lc = Object.defineProperty;
var uc = (a, e, t) => e in a ? lc(a, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : a[e] = t;
var ue = (a, e, t) => uc(a, typeof e != "symbol" ? e + "" : e, t);
import { app as Le, ipcMain as xe, BrowserWindow as Vs, protocol as pc, shell as Ea } from "electron";
import { app as nf } from "electron";
import ye, { resolve as Sa } from "path";
import Vt, { fileURLToPath as dc } from "url";
import mc from "better-sqlite3";
import aa from "fs";
import fc from "constants";
import Ce, { Readable as hc } from "stream";
import Qe from "util";
import ra from "assert";
import We from "crypto";
import Js, { EventEmitter as vc } from "events";
import Ot from "node-hid";
import Dt from "usb";
import sa from "http";
import oa from "https";
import xc from "net";
import gc from "tls";
import Xs from "tty";
import yc from "os";
import Qs from "http2";
import Je from "zlib";
import { Service as ft } from "node-windows";
var pn = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Jt(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var dn = {}, It = {}, Ra;
function Ie() {
  return Ra || (Ra = 1, It.fromCallback = function(a) {
    return Object.defineProperty(function(...e) {
      if (typeof e[e.length - 1] == "function") a.apply(this, e);
      else
        return new Promise((t, i) => {
          e.push((n, s) => n != null ? i(n) : t(s)), a.apply(this, e);
        });
    }, "name", { value: a.name });
  }, It.fromPromise = function(a) {
    return Object.defineProperty(function(...e) {
      const t = e[e.length - 1];
      if (typeof t != "function") return a.apply(this, e);
      e.pop(), a.apply(this, e).then((i) => t(null, i), t);
    }, "name", { value: a.name });
  }), It;
}
var mn, ka;
function bc() {
  if (ka) return mn;
  ka = 1;
  var a = fc, e = process.cwd, t = null, i = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    return t || (t = e.call(process)), t;
  };
  try {
    process.cwd();
  } catch {
  }
  if (typeof process.chdir == "function") {
    var n = process.chdir;
    process.chdir = function(r) {
      t = null, n.call(process, r);
    }, Object.setPrototypeOf && Object.setPrototypeOf(process.chdir, n);
  }
  mn = s;
  function s(r) {
    a.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./) && c(r), r.lutimes || l(r), r.chown = u(r.chown), r.fchown = u(r.fchown), r.lchown = u(r.lchown), r.chmod = p(r.chmod), r.fchmod = p(r.fchmod), r.lchmod = p(r.lchmod), r.chownSync = d(r.chownSync), r.fchownSync = d(r.fchownSync), r.lchownSync = d(r.lchownSync), r.chmodSync = m(r.chmodSync), r.fchmodSync = m(r.fchmodSync), r.lchmodSync = m(r.lchmodSync), r.stat = v(r.stat), r.fstat = v(r.fstat), r.lstat = v(r.lstat), r.statSync = y(r.statSync), r.fstatSync = y(r.fstatSync), r.lstatSync = y(r.lstatSync), r.chmod && !r.lchmod && (r.lchmod = function(f, h, b) {
      b && process.nextTick(b);
    }, r.lchmodSync = function() {
    }), r.chown && !r.lchown && (r.lchown = function(f, h, b, S) {
      S && process.nextTick(S);
    }, r.lchownSync = function() {
    }), i === "win32" && (r.rename = typeof r.rename != "function" ? r.rename : (function(f) {
      function h(b, S, E) {
        var w = Date.now(), A = 0;
        f(b, S, function O(W) {
          if (W && (W.code === "EACCES" || W.code === "EPERM" || W.code === "EBUSY") && Date.now() - w < 6e4) {
            setTimeout(function() {
              r.stat(S, function(X, V) {
                X && X.code === "ENOENT" ? f(b, S, O) : E(W);
              });
            }, A), A < 100 && (A += 10);
            return;
          }
          E && E(W);
        });
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(h, f), h;
    })(r.rename)), r.read = typeof r.read != "function" ? r.read : (function(f) {
      function h(b, S, E, w, A, O) {
        var W;
        if (O && typeof O == "function") {
          var X = 0;
          W = function(V, pe, me) {
            if (V && V.code === "EAGAIN" && X < 10)
              return X++, f.call(r, b, S, E, w, A, W);
            O.apply(this, arguments);
          };
        }
        return f.call(r, b, S, E, w, A, W);
      }
      return Object.setPrototypeOf && Object.setPrototypeOf(h, f), h;
    })(r.read), r.readSync = typeof r.readSync != "function" ? r.readSync : /* @__PURE__ */ (function(f) {
      return function(h, b, S, E, w) {
        for (var A = 0; ; )
          try {
            return f.call(r, h, b, S, E, w);
          } catch (O) {
            if (O.code === "EAGAIN" && A < 10) {
              A++;
              continue;
            }
            throw O;
          }
      };
    })(r.readSync);
    function c(f) {
      f.lchmod = function(h, b, S) {
        f.open(
          h,
          a.O_WRONLY | a.O_SYMLINK,
          b,
          function(E, w) {
            if (E) {
              S && S(E);
              return;
            }
            f.fchmod(w, b, function(A) {
              f.close(w, function(O) {
                S && S(A || O);
              });
            });
          }
        );
      }, f.lchmodSync = function(h, b) {
        var S = f.openSync(h, a.O_WRONLY | a.O_SYMLINK, b), E = !0, w;
        try {
          w = f.fchmodSync(S, b), E = !1;
        } finally {
          if (E)
            try {
              f.closeSync(S);
            } catch {
            }
          else
            f.closeSync(S);
        }
        return w;
      };
    }
    function l(f) {
      a.hasOwnProperty("O_SYMLINK") && f.futimes ? (f.lutimes = function(h, b, S, E) {
        f.open(h, a.O_SYMLINK, function(w, A) {
          if (w) {
            E && E(w);
            return;
          }
          f.futimes(A, b, S, function(O) {
            f.close(A, function(W) {
              E && E(O || W);
            });
          });
        });
      }, f.lutimesSync = function(h, b, S) {
        var E = f.openSync(h, a.O_SYMLINK), w, A = !0;
        try {
          w = f.futimesSync(E, b, S), A = !1;
        } finally {
          if (A)
            try {
              f.closeSync(E);
            } catch {
            }
          else
            f.closeSync(E);
        }
        return w;
      }) : f.futimes && (f.lutimes = function(h, b, S, E) {
        E && process.nextTick(E);
      }, f.lutimesSync = function() {
      });
    }
    function p(f) {
      return f && function(h, b, S) {
        return f.call(r, h, b, function(E) {
          g(E) && (E = null), S && S.apply(this, arguments);
        });
      };
    }
    function m(f) {
      return f && function(h, b) {
        try {
          return f.call(r, h, b);
        } catch (S) {
          if (!g(S)) throw S;
        }
      };
    }
    function u(f) {
      return f && function(h, b, S, E) {
        return f.call(r, h, b, S, function(w) {
          g(w) && (w = null), E && E.apply(this, arguments);
        });
      };
    }
    function d(f) {
      return f && function(h, b, S) {
        try {
          return f.call(r, h, b, S);
        } catch (E) {
          if (!g(E)) throw E;
        }
      };
    }
    function v(f) {
      return f && function(h, b, S) {
        typeof b == "function" && (S = b, b = null);
        function E(w, A) {
          A && (A.uid < 0 && (A.uid += 4294967296), A.gid < 0 && (A.gid += 4294967296)), S && S.apply(this, arguments);
        }
        return b ? f.call(r, h, b, E) : f.call(r, h, E);
      };
    }
    function y(f) {
      return f && function(h, b) {
        var S = b ? f.call(r, h, b) : f.call(r, h);
        return S && (S.uid < 0 && (S.uid += 4294967296), S.gid < 0 && (S.gid += 4294967296)), S;
      };
    }
    function g(f) {
      if (!f || f.code === "ENOSYS")
        return !0;
      var h = !process.getuid || process.getuid() !== 0;
      return !!(h && (f.code === "EINVAL" || f.code === "EPERM"));
    }
  }
  return mn;
}
var fn, Ta;
function _c() {
  if (Ta) return fn;
  Ta = 1;
  var a = Ce.Stream;
  fn = e;
  function e(t) {
    return {
      ReadStream: i,
      WriteStream: n
    };
    function i(s, r) {
      if (!(this instanceof i)) return new i(s, r);
      a.call(this);
      var c = this;
      this.path = s, this.fd = null, this.readable = !0, this.paused = !1, this.flags = "r", this.mode = 438, this.bufferSize = 64 * 1024, r = r || {};
      for (var l = Object.keys(r), p = 0, m = l.length; p < m; p++) {
        var u = l[p];
        this[u] = r[u];
      }
      if (this.encoding && this.setEncoding(this.encoding), this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.end === void 0)
          this.end = 1 / 0;
        else if (typeof this.end != "number")
          throw TypeError("end must be a Number");
        if (this.start > this.end)
          throw new Error("start must be <= end");
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          c._read();
        });
        return;
      }
      t.open(this.path, this.flags, this.mode, function(d, v) {
        if (d) {
          c.emit("error", d), c.readable = !1;
          return;
        }
        c.fd = v, c.emit("open", v), c._read();
      });
    }
    function n(s, r) {
      if (!(this instanceof n)) return new n(s, r);
      a.call(this), this.path = s, this.fd = null, this.writable = !0, this.flags = "w", this.encoding = "binary", this.mode = 438, this.bytesWritten = 0, r = r || {};
      for (var c = Object.keys(r), l = 0, p = c.length; l < p; l++) {
        var m = c[l];
        this[m] = r[m];
      }
      if (this.start !== void 0) {
        if (typeof this.start != "number")
          throw TypeError("start must be a Number");
        if (this.start < 0)
          throw new Error("start must be >= zero");
        this.pos = this.start;
      }
      this.busy = !1, this._queue = [], this.fd === null && (this._open = t.open, this._queue.push([this._open, this.path, this.flags, this.mode, void 0]), this.flush());
    }
  }
  return fn;
}
var hn, Aa;
function wc() {
  if (Aa) return hn;
  Aa = 1, hn = e;
  var a = Object.getPrototypeOf || function(t) {
    return t.__proto__;
  };
  function e(t) {
    if (t === null || typeof t != "object")
      return t;
    if (t instanceof Object)
      var i = { __proto__: a(t) };
    else
      var i = /* @__PURE__ */ Object.create(null);
    return Object.getOwnPropertyNames(t).forEach(function(n) {
      Object.defineProperty(i, n, Object.getOwnPropertyDescriptor(t, n));
    }), i;
  }
  return hn;
}
var Pt, Ca;
function _t() {
  if (Ca) return Pt;
  Ca = 1;
  var a = aa, e = bc(), t = _c(), i = wc(), n = Qe, s, r;
  typeof Symbol == "function" && typeof Symbol.for == "function" ? (s = Symbol.for("graceful-fs.queue"), r = Symbol.for("graceful-fs.previous")) : (s = "___graceful-fs.queue", r = "___graceful-fs.previous");
  function c() {
  }
  function l(f, h) {
    Object.defineProperty(f, s, {
      get: function() {
        return h;
      }
    });
  }
  var p = c;
  if (n.debuglog ? p = n.debuglog("gfs4") : /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && (p = function() {
    var f = n.format.apply(n, arguments);
    f = "GFS4: " + f.split(/\n/).join(`
GFS4: `), console.error(f);
  }), !a[s]) {
    var m = pn[s] || [];
    l(a, m), a.close = (function(f) {
      function h(b, S) {
        return f.call(a, b, function(E) {
          E || y(), typeof S == "function" && S.apply(this, arguments);
        });
      }
      return Object.defineProperty(h, r, {
        value: f
      }), h;
    })(a.close), a.closeSync = (function(f) {
      function h(b) {
        f.apply(a, arguments), y();
      }
      return Object.defineProperty(h, r, {
        value: f
      }), h;
    })(a.closeSync), /\bgfs4\b/i.test(process.env.NODE_DEBUG || "") && process.on("exit", function() {
      p(a[s]), ra.equal(a[s].length, 0);
    });
  }
  pn[s] || l(pn, a[s]), Pt = u(i(a)), process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !a.__patched && (Pt = u(a), a.__patched = !0);
  function u(f) {
    e(f), f.gracefulify = u, f.createReadStream = z, f.createWriteStream = Z;
    var h = f.readFile;
    f.readFile = b;
    function b(Y, se, P) {
      return typeof se == "function" && (P = se, se = null), C(Y, se, P);
      function C($, G, q, ee) {
        return h($, G, function(ne) {
          ne && (ne.code === "EMFILE" || ne.code === "ENFILE") ? d([C, [$, G, q], ne, ee || Date.now(), Date.now()]) : typeof q == "function" && q.apply(this, arguments);
        });
      }
    }
    var S = f.writeFile;
    f.writeFile = E;
    function E(Y, se, P, C) {
      return typeof P == "function" && (C = P, P = null), $(Y, se, P, C);
      function $(G, q, ee, ne, ie) {
        return S(G, q, ee, function(ce) {
          ce && (ce.code === "EMFILE" || ce.code === "ENFILE") ? d([$, [G, q, ee, ne], ce, ie || Date.now(), Date.now()]) : typeof ne == "function" && ne.apply(this, arguments);
        });
      }
    }
    var w = f.appendFile;
    w && (f.appendFile = A);
    function A(Y, se, P, C) {
      return typeof P == "function" && (C = P, P = null), $(Y, se, P, C);
      function $(G, q, ee, ne, ie) {
        return w(G, q, ee, function(ce) {
          ce && (ce.code === "EMFILE" || ce.code === "ENFILE") ? d([$, [G, q, ee, ne], ce, ie || Date.now(), Date.now()]) : typeof ne == "function" && ne.apply(this, arguments);
        });
      }
    }
    var O = f.copyFile;
    O && (f.copyFile = W);
    function W(Y, se, P, C) {
      return typeof P == "function" && (C = P, P = 0), $(Y, se, P, C);
      function $(G, q, ee, ne, ie) {
        return O(G, q, ee, function(ce) {
          ce && (ce.code === "EMFILE" || ce.code === "ENFILE") ? d([$, [G, q, ee, ne], ce, ie || Date.now(), Date.now()]) : typeof ne == "function" && ne.apply(this, arguments);
        });
      }
    }
    var X = f.readdir;
    f.readdir = pe;
    var V = /^v[0-5]\./;
    function pe(Y, se, P) {
      typeof se == "function" && (P = se, se = null);
      var C = V.test(process.version) ? function(q, ee, ne, ie) {
        return X(q, $(
          q,
          ee,
          ne,
          ie
        ));
      } : function(q, ee, ne, ie) {
        return X(q, ee, $(
          q,
          ee,
          ne,
          ie
        ));
      };
      return C(Y, se, P);
      function $(G, q, ee, ne) {
        return function(ie, ce) {
          ie && (ie.code === "EMFILE" || ie.code === "ENFILE") ? d([
            C,
            [G, q, ee],
            ie,
            ne || Date.now(),
            Date.now()
          ]) : (ce && ce.sort && ce.sort(), typeof ee == "function" && ee.call(this, ie, ce));
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var me = t(f);
      we = me.ReadStream, k = me.WriteStream;
    }
    var ke = f.ReadStream;
    ke && (we.prototype = Object.create(ke.prototype), we.prototype.open = J);
    var le = f.WriteStream;
    le && (k.prototype = Object.create(le.prototype), k.prototype.open = M), Object.defineProperty(f, "ReadStream", {
      get: function() {
        return we;
      },
      set: function(Y) {
        we = Y;
      },
      enumerable: !0,
      configurable: !0
    }), Object.defineProperty(f, "WriteStream", {
      get: function() {
        return k;
      },
      set: function(Y) {
        k = Y;
      },
      enumerable: !0,
      configurable: !0
    });
    var fe = we;
    Object.defineProperty(f, "FileReadStream", {
      get: function() {
        return fe;
      },
      set: function(Y) {
        fe = Y;
      },
      enumerable: !0,
      configurable: !0
    });
    var he = k;
    Object.defineProperty(f, "FileWriteStream", {
      get: function() {
        return he;
      },
      set: function(Y) {
        he = Y;
      },
      enumerable: !0,
      configurable: !0
    });
    function we(Y, se) {
      return this instanceof we ? (ke.apply(this, arguments), this) : we.apply(Object.create(we.prototype), arguments);
    }
    function J() {
      var Y = this;
      de(Y.path, Y.flags, Y.mode, function(se, P) {
        se ? (Y.autoClose && Y.destroy(), Y.emit("error", se)) : (Y.fd = P, Y.emit("open", P), Y.read());
      });
    }
    function k(Y, se) {
      return this instanceof k ? (le.apply(this, arguments), this) : k.apply(Object.create(k.prototype), arguments);
    }
    function M() {
      var Y = this;
      de(Y.path, Y.flags, Y.mode, function(se, P) {
        se ? (Y.destroy(), Y.emit("error", se)) : (Y.fd = P, Y.emit("open", P));
      });
    }
    function z(Y, se) {
      return new f.ReadStream(Y, se);
    }
    function Z(Y, se) {
      return new f.WriteStream(Y, se);
    }
    var re = f.open;
    f.open = de;
    function de(Y, se, P, C) {
      return typeof P == "function" && (C = P, P = null), $(Y, se, P, C);
      function $(G, q, ee, ne, ie) {
        return re(G, q, ee, function(ce, _e) {
          ce && (ce.code === "EMFILE" || ce.code === "ENFILE") ? d([$, [G, q, ee, ne], ce, ie || Date.now(), Date.now()]) : typeof ne == "function" && ne.apply(this, arguments);
        });
      }
    }
    return f;
  }
  function d(f) {
    p("ENQUEUE", f[0].name, f[1]), a[s].push(f), g();
  }
  var v;
  function y() {
    for (var f = Date.now(), h = 0; h < a[s].length; ++h)
      a[s][h].length > 2 && (a[s][h][3] = f, a[s][h][4] = f);
    g();
  }
  function g() {
    if (clearTimeout(v), v = void 0, a[s].length !== 0) {
      var f = a[s].shift(), h = f[0], b = f[1], S = f[2], E = f[3], w = f[4];
      if (E === void 0)
        p("RETRY", h.name, b), h.apply(null, b);
      else if (Date.now() - E >= 6e4) {
        p("TIMEOUT", h.name, b);
        var A = b.pop();
        typeof A == "function" && A.call(null, S);
      } else {
        var O = Date.now() - w, W = Math.max(w - E, 1), X = Math.min(W * 1.2, 100);
        O >= X ? (p("RETRY", h.name, b), h.apply(null, b.concat([E]))) : a[s].push(f);
      }
      v === void 0 && (v = setTimeout(g, 0));
    }
  }
  return Pt;
}
var Oa;
function je() {
  return Oa || (Oa = 1, (function(a) {
    const e = Ie().fromCallback, t = _t(), i = [
      "access",
      "appendFile",
      "chmod",
      "chown",
      "close",
      "copyFile",
      "cp",
      "fchmod",
      "fchown",
      "fdatasync",
      "fstat",
      "fsync",
      "ftruncate",
      "futimes",
      "glob",
      "lchmod",
      "lchown",
      "lutimes",
      "link",
      "lstat",
      "mkdir",
      "mkdtemp",
      "open",
      "opendir",
      "readdir",
      "readFile",
      "readlink",
      "realpath",
      "rename",
      "rm",
      "rmdir",
      "stat",
      "statfs",
      "symlink",
      "truncate",
      "unlink",
      "utimes",
      "writeFile"
    ].filter((n) => typeof t[n] == "function");
    Object.assign(a, t), i.forEach((n) => {
      a[n] = e(t[n]);
    }), a.exists = function(n, s) {
      return typeof s == "function" ? t.exists(n, s) : new Promise((r) => t.exists(n, r));
    }, a.read = function(n, s, r, c, l, p) {
      return typeof p == "function" ? t.read(n, s, r, c, l, p) : new Promise((m, u) => {
        t.read(n, s, r, c, l, (d, v, y) => {
          if (d) return u(d);
          m({ bytesRead: v, buffer: y });
        });
      });
    }, a.write = function(n, s, ...r) {
      return typeof r[r.length - 1] == "function" ? t.write(n, s, ...r) : new Promise((c, l) => {
        t.write(n, s, ...r, (p, m, u) => {
          if (p) return l(p);
          c({ bytesWritten: m, buffer: u });
        });
      });
    }, a.readv = function(n, s, ...r) {
      return typeof r[r.length - 1] == "function" ? t.readv(n, s, ...r) : new Promise((c, l) => {
        t.readv(n, s, ...r, (p, m, u) => {
          if (p) return l(p);
          c({ bytesRead: m, buffers: u });
        });
      });
    }, a.writev = function(n, s, ...r) {
      return typeof r[r.length - 1] == "function" ? t.writev(n, s, ...r) : new Promise((c, l) => {
        t.writev(n, s, ...r, (p, m, u) => {
          if (p) return l(p);
          c({ bytesWritten: m, buffers: u });
        });
      });
    }, typeof t.realpath.native == "function" ? a.realpath.native = e(t.realpath.native) : process.emitWarning(
      "fs.realpath.native is not a function. Is fs being monkey-patched?",
      "Warning",
      "fs-extra-WARN0003"
    );
  })(dn)), dn;
}
var Ft = {}, vn = {}, Da;
function Ec() {
  if (Da) return vn;
  Da = 1;
  const a = ye;
  return vn.checkPath = function(t) {
    if (process.platform === "win32" && /[<>:"|?*]/.test(t.replace(a.parse(t).root, ""))) {
      const n = new Error(`Path contains invalid characters: ${t}`);
      throw n.code = "EINVAL", n;
    }
  }, vn;
}
var Ia;
function Sc() {
  if (Ia) return Ft;
  Ia = 1;
  const a = /* @__PURE__ */ je(), { checkPath: e } = /* @__PURE__ */ Ec(), t = (i) => {
    const n = { mode: 511 };
    return typeof i == "number" ? i : { ...n, ...i }.mode;
  };
  return Ft.makeDir = async (i, n) => (e(i), a.mkdir(i, {
    mode: t(n),
    recursive: !0
  })), Ft.makeDirSync = (i, n) => (e(i), a.mkdirSync(i, {
    mode: t(n),
    recursive: !0
  })), Ft;
}
var xn, Pa;
function $e() {
  if (Pa) return xn;
  Pa = 1;
  const a = Ie().fromPromise, { makeDir: e, makeDirSync: t } = /* @__PURE__ */ Sc(), i = a(e);
  return xn = {
    mkdirs: i,
    mkdirsSync: t,
    // alias
    mkdirp: i,
    mkdirpSync: t,
    ensureDir: i,
    ensureDirSync: t
  }, xn;
}
var gn, Fa;
function at() {
  if (Fa) return gn;
  Fa = 1;
  const a = Ie().fromPromise, e = /* @__PURE__ */ je();
  function t(i) {
    return e.access(i).then(() => !0).catch(() => !1);
  }
  return gn = {
    pathExists: a(t),
    pathExistsSync: e.existsSync
  }, gn;
}
var yn, La;
function Zs() {
  if (La) return yn;
  La = 1;
  const a = /* @__PURE__ */ je(), e = Ie().fromPromise;
  async function t(n, s, r) {
    const c = await a.open(n, "r+");
    let l = null;
    try {
      await a.futimes(c, s, r);
    } catch (p) {
      l = p;
    } finally {
      try {
        await a.close(c);
      } catch (p) {
        l || (l = p);
      }
    }
    if (l)
      throw l;
  }
  function i(n, s, r) {
    const c = a.openSync(n, "r+");
    let l = null;
    try {
      a.futimesSync(c, s, r);
    } catch (p) {
      l = p;
    } finally {
      try {
        a.closeSync(c);
      } catch (p) {
        l || (l = p);
      }
    }
    if (l)
      throw l;
  }
  return yn = {
    utimesMillis: e(t),
    utimesMillisSync: i
  }, yn;
}
var bn, Na;
function ut() {
  if (Na) return bn;
  Na = 1;
  const a = /* @__PURE__ */ je(), e = ye, t = Ie().fromPromise;
  function i(d, v, y) {
    const g = y.dereference ? (f) => a.stat(f, { bigint: !0 }) : (f) => a.lstat(f, { bigint: !0 });
    return Promise.all([
      g(d),
      g(v).catch((f) => {
        if (f.code === "ENOENT") return null;
        throw f;
      })
    ]).then(([f, h]) => ({ srcStat: f, destStat: h }));
  }
  function n(d, v, y) {
    let g;
    const f = y.dereference ? (b) => a.statSync(b, { bigint: !0 }) : (b) => a.lstatSync(b, { bigint: !0 }), h = f(d);
    try {
      g = f(v);
    } catch (b) {
      if (b.code === "ENOENT") return { srcStat: h, destStat: null };
      throw b;
    }
    return { srcStat: h, destStat: g };
  }
  async function s(d, v, y, g) {
    const { srcStat: f, destStat: h } = await i(d, v, g);
    if (h) {
      if (p(f, h)) {
        const b = e.basename(d), S = e.basename(v);
        if (y === "move" && b !== S && b.toLowerCase() === S.toLowerCase())
          return { srcStat: f, destStat: h, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (f.isDirectory() && !h.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${v}' with directory '${d}'.`);
      if (!f.isDirectory() && h.isDirectory())
        throw new Error(`Cannot overwrite directory '${v}' with non-directory '${d}'.`);
    }
    if (f.isDirectory() && m(d, v))
      throw new Error(u(d, v, y));
    return { srcStat: f, destStat: h };
  }
  function r(d, v, y, g) {
    const { srcStat: f, destStat: h } = n(d, v, g);
    if (h) {
      if (p(f, h)) {
        const b = e.basename(d), S = e.basename(v);
        if (y === "move" && b !== S && b.toLowerCase() === S.toLowerCase())
          return { srcStat: f, destStat: h, isChangingCase: !0 };
        throw new Error("Source and destination must not be the same.");
      }
      if (f.isDirectory() && !h.isDirectory())
        throw new Error(`Cannot overwrite non-directory '${v}' with directory '${d}'.`);
      if (!f.isDirectory() && h.isDirectory())
        throw new Error(`Cannot overwrite directory '${v}' with non-directory '${d}'.`);
    }
    if (f.isDirectory() && m(d, v))
      throw new Error(u(d, v, y));
    return { srcStat: f, destStat: h };
  }
  async function c(d, v, y, g) {
    const f = e.resolve(e.dirname(d)), h = e.resolve(e.dirname(y));
    if (h === f || h === e.parse(h).root) return;
    let b;
    try {
      b = await a.stat(h, { bigint: !0 });
    } catch (S) {
      if (S.code === "ENOENT") return;
      throw S;
    }
    if (p(v, b))
      throw new Error(u(d, y, g));
    return c(d, v, h, g);
  }
  function l(d, v, y, g) {
    const f = e.resolve(e.dirname(d)), h = e.resolve(e.dirname(y));
    if (h === f || h === e.parse(h).root) return;
    let b;
    try {
      b = a.statSync(h, { bigint: !0 });
    } catch (S) {
      if (S.code === "ENOENT") return;
      throw S;
    }
    if (p(v, b))
      throw new Error(u(d, y, g));
    return l(d, v, h, g);
  }
  function p(d, v) {
    return v.ino !== void 0 && v.dev !== void 0 && v.ino === d.ino && v.dev === d.dev;
  }
  function m(d, v) {
    const y = e.resolve(d).split(e.sep).filter((f) => f), g = e.resolve(v).split(e.sep).filter((f) => f);
    return y.every((f, h) => g[h] === f);
  }
  function u(d, v, y) {
    return `Cannot ${y} '${d}' to a subdirectory of itself, '${v}'.`;
  }
  return bn = {
    // checkPaths
    checkPaths: t(s),
    checkPathsSync: r,
    // checkParent
    checkParentPaths: t(c),
    checkParentPathsSync: l,
    // Misc
    isSrcSubdir: m,
    areIdentical: p
  }, bn;
}
var _n, ja;
function Rc() {
  if (ja) return _n;
  ja = 1;
  async function a(e, t) {
    const i = [];
    for await (const n of e)
      i.push(
        t(n).then(
          () => null,
          (s) => s ?? new Error("unknown error")
        )
      );
    await Promise.all(
      i.map(
        (n) => n.then((s) => {
          if (s !== null) throw s;
        })
      )
    );
  }
  return _n = {
    asyncIteratorConcurrentProcess: a
  }, _n;
}
var wn, Ma;
function kc() {
  if (Ma) return wn;
  Ma = 1;
  const a = /* @__PURE__ */ je(), e = ye, { mkdirs: t } = /* @__PURE__ */ $e(), { pathExists: i } = /* @__PURE__ */ at(), { utimesMillis: n } = /* @__PURE__ */ Zs(), s = /* @__PURE__ */ ut(), { asyncIteratorConcurrentProcess: r } = /* @__PURE__ */ Rc();
  async function c(f, h, b = {}) {
    typeof b == "function" && (b = { filter: b }), b.clobber = "clobber" in b ? !!b.clobber : !0, b.overwrite = "overwrite" in b ? !!b.overwrite : b.clobber, b.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0001"
    );
    const { srcStat: S, destStat: E } = await s.checkPaths(f, h, "copy", b);
    if (await s.checkParentPaths(f, S, h, "copy"), !await l(f, h, b)) return;
    const A = e.dirname(h);
    await i(A) || await t(A), await p(E, f, h, b);
  }
  async function l(f, h, b) {
    return b.filter ? b.filter(f, h) : !0;
  }
  async function p(f, h, b, S) {
    const w = await (S.dereference ? a.stat : a.lstat)(h);
    if (w.isDirectory()) return y(w, f, h, b, S);
    if (w.isFile() || w.isCharacterDevice() || w.isBlockDevice()) return m(w, f, h, b, S);
    if (w.isSymbolicLink()) return g(f, h, b, S);
    throw w.isSocket() ? new Error(`Cannot copy a socket file: ${h}`) : w.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${h}`) : new Error(`Unknown file: ${h}`);
  }
  async function m(f, h, b, S, E) {
    if (!h) return u(f, b, S, E);
    if (E.overwrite)
      return await a.unlink(S), u(f, b, S, E);
    if (E.errorOnExist)
      throw new Error(`'${S}' already exists`);
  }
  async function u(f, h, b, S) {
    if (await a.copyFile(h, b), S.preserveTimestamps) {
      d(f.mode) && await v(b, f.mode);
      const E = await a.stat(h);
      await n(b, E.atime, E.mtime);
    }
    return a.chmod(b, f.mode);
  }
  function d(f) {
    return (f & 128) === 0;
  }
  function v(f, h) {
    return a.chmod(f, h | 128);
  }
  async function y(f, h, b, S, E) {
    h || await a.mkdir(S), await r(await a.opendir(b), async (w) => {
      const A = e.join(b, w.name), O = e.join(S, w.name);
      if (await l(A, O, E)) {
        const { destStat: X } = await s.checkPaths(A, O, "copy", E);
        await p(X, A, O, E);
      }
    }), h || await a.chmod(S, f.mode);
  }
  async function g(f, h, b, S) {
    let E = await a.readlink(h);
    if (S.dereference && (E = e.resolve(process.cwd(), E)), !f)
      return a.symlink(E, b);
    let w = null;
    try {
      w = await a.readlink(b);
    } catch (A) {
      if (A.code === "EINVAL" || A.code === "UNKNOWN") return a.symlink(E, b);
      throw A;
    }
    if (S.dereference && (w = e.resolve(process.cwd(), w)), E !== w) {
      if (s.isSrcSubdir(E, w))
        throw new Error(`Cannot copy '${E}' to a subdirectory of itself, '${w}'.`);
      if (s.isSrcSubdir(w, E))
        throw new Error(`Cannot overwrite '${w}' with '${E}'.`);
    }
    return await a.unlink(b), a.symlink(E, b);
  }
  return wn = c, wn;
}
var En, Ua;
function Tc() {
  if (Ua) return En;
  Ua = 1;
  const a = _t(), e = ye, t = $e().mkdirsSync, i = Zs().utimesMillisSync, n = /* @__PURE__ */ ut();
  function s(w, A, O) {
    typeof O == "function" && (O = { filter: O }), O = O || {}, O.clobber = "clobber" in O ? !!O.clobber : !0, O.overwrite = "overwrite" in O ? !!O.overwrite : O.clobber, O.preserveTimestamps && process.arch === "ia32" && process.emitWarning(
      `Using the preserveTimestamps option in 32-bit node is not recommended;

	see https://github.com/jprichardson/node-fs-extra/issues/269`,
      "Warning",
      "fs-extra-WARN0002"
    );
    const { srcStat: W, destStat: X } = n.checkPathsSync(w, A, "copy", O);
    if (n.checkParentPathsSync(w, W, A, "copy"), O.filter && !O.filter(w, A)) return;
    const V = e.dirname(A);
    return a.existsSync(V) || t(V), r(X, w, A, O);
  }
  function r(w, A, O, W) {
    const V = (W.dereference ? a.statSync : a.lstatSync)(A);
    if (V.isDirectory()) return g(V, w, A, O, W);
    if (V.isFile() || V.isCharacterDevice() || V.isBlockDevice()) return c(V, w, A, O, W);
    if (V.isSymbolicLink()) return S(w, A, O, W);
    throw V.isSocket() ? new Error(`Cannot copy a socket file: ${A}`) : V.isFIFO() ? new Error(`Cannot copy a FIFO pipe: ${A}`) : new Error(`Unknown file: ${A}`);
  }
  function c(w, A, O, W, X) {
    return A ? l(w, O, W, X) : p(w, O, W, X);
  }
  function l(w, A, O, W) {
    if (W.overwrite)
      return a.unlinkSync(O), p(w, A, O, W);
    if (W.errorOnExist)
      throw new Error(`'${O}' already exists`);
  }
  function p(w, A, O, W) {
    return a.copyFileSync(A, O), W.preserveTimestamps && m(w.mode, A, O), v(O, w.mode);
  }
  function m(w, A, O) {
    return u(w) && d(O, w), y(A, O);
  }
  function u(w) {
    return (w & 128) === 0;
  }
  function d(w, A) {
    return v(w, A | 128);
  }
  function v(w, A) {
    return a.chmodSync(w, A);
  }
  function y(w, A) {
    const O = a.statSync(w);
    return i(A, O.atime, O.mtime);
  }
  function g(w, A, O, W, X) {
    return A ? h(O, W, X) : f(w.mode, O, W, X);
  }
  function f(w, A, O, W) {
    return a.mkdirSync(O), h(A, O, W), v(O, w);
  }
  function h(w, A, O) {
    const W = a.opendirSync(w);
    try {
      let X;
      for (; (X = W.readSync()) !== null; )
        b(X.name, w, A, O);
    } finally {
      W.closeSync();
    }
  }
  function b(w, A, O, W) {
    const X = e.join(A, w), V = e.join(O, w);
    if (W.filter && !W.filter(X, V)) return;
    const { destStat: pe } = n.checkPathsSync(X, V, "copy", W);
    return r(pe, X, V, W);
  }
  function S(w, A, O, W) {
    let X = a.readlinkSync(A);
    if (W.dereference && (X = e.resolve(process.cwd(), X)), w) {
      let V;
      try {
        V = a.readlinkSync(O);
      } catch (pe) {
        if (pe.code === "EINVAL" || pe.code === "UNKNOWN") return a.symlinkSync(X, O);
        throw pe;
      }
      if (W.dereference && (V = e.resolve(process.cwd(), V)), X !== V) {
        if (n.isSrcSubdir(X, V))
          throw new Error(`Cannot copy '${X}' to a subdirectory of itself, '${V}'.`);
        if (n.isSrcSubdir(V, X))
          throw new Error(`Cannot overwrite '${V}' with '${X}'.`);
      }
      return E(X, O);
    } else
      return a.symlinkSync(X, O);
  }
  function E(w, A) {
    return a.unlinkSync(A), a.symlinkSync(w, A);
  }
  return En = s, En;
}
var Sn, qa;
function ca() {
  if (qa) return Sn;
  qa = 1;
  const a = Ie().fromPromise;
  return Sn = {
    copy: a(/* @__PURE__ */ kc()),
    copySync: /* @__PURE__ */ Tc()
  }, Sn;
}
var Rn, Ba;
function Xt() {
  if (Ba) return Rn;
  Ba = 1;
  const a = _t(), e = Ie().fromCallback;
  function t(n, s) {
    a.rm(n, { recursive: !0, force: !0 }, s);
  }
  function i(n) {
    a.rmSync(n, { recursive: !0, force: !0 });
  }
  return Rn = {
    remove: e(t),
    removeSync: i
  }, Rn;
}
var kn, Ha;
function Ac() {
  if (Ha) return kn;
  Ha = 1;
  const a = Ie().fromPromise, e = /* @__PURE__ */ je(), t = ye, i = /* @__PURE__ */ $e(), n = /* @__PURE__ */ Xt(), s = a(async function(l) {
    let p;
    try {
      p = await e.readdir(l);
    } catch {
      return i.mkdirs(l);
    }
    return Promise.all(p.map((m) => n.remove(t.join(l, m))));
  });
  function r(c) {
    let l;
    try {
      l = e.readdirSync(c);
    } catch {
      return i.mkdirsSync(c);
    }
    l.forEach((p) => {
      p = t.join(c, p), n.removeSync(p);
    });
  }
  return kn = {
    emptyDirSync: r,
    emptydirSync: r,
    emptyDir: s,
    emptydir: s
  }, kn;
}
var Tn, $a;
function Cc() {
  if ($a) return Tn;
  $a = 1;
  const a = Ie().fromPromise, e = ye, t = /* @__PURE__ */ je(), i = /* @__PURE__ */ $e();
  async function n(r) {
    let c;
    try {
      c = await t.stat(r);
    } catch {
    }
    if (c && c.isFile()) return;
    const l = e.dirname(r);
    let p = null;
    try {
      p = await t.stat(l);
    } catch (m) {
      if (m.code === "ENOENT") {
        await i.mkdirs(l), await t.writeFile(r, "");
        return;
      } else
        throw m;
    }
    p.isDirectory() ? await t.writeFile(r, "") : await t.readdir(l);
  }
  function s(r) {
    let c;
    try {
      c = t.statSync(r);
    } catch {
    }
    if (c && c.isFile()) return;
    const l = e.dirname(r);
    try {
      t.statSync(l).isDirectory() || t.readdirSync(l);
    } catch (p) {
      if (p && p.code === "ENOENT") i.mkdirsSync(l);
      else throw p;
    }
    t.writeFileSync(r, "");
  }
  return Tn = {
    createFile: a(n),
    createFileSync: s
  }, Tn;
}
var An, Ka;
function Oc() {
  if (Ka) return An;
  Ka = 1;
  const a = Ie().fromPromise, e = ye, t = /* @__PURE__ */ je(), i = /* @__PURE__ */ $e(), { pathExists: n } = /* @__PURE__ */ at(), { areIdentical: s } = /* @__PURE__ */ ut();
  async function r(l, p) {
    let m;
    try {
      m = await t.lstat(p, { bigint: !0 });
    } catch {
    }
    let u;
    try {
      u = await t.lstat(l, { bigint: !0 });
    } catch (y) {
      throw y.message = y.message.replace("lstat", "ensureLink"), y;
    }
    if (m && s(u, m)) return;
    const d = e.dirname(p);
    await n(d) || await i.mkdirs(d), await t.link(l, p);
  }
  function c(l, p) {
    let m;
    try {
      m = t.lstatSync(p, { bigint: !0 });
    } catch {
    }
    try {
      const v = t.lstatSync(l, { bigint: !0 });
      if (m && s(v, m)) return;
    } catch (v) {
      throw v.message = v.message.replace("lstat", "ensureLink"), v;
    }
    const u = e.dirname(p);
    return t.existsSync(u) || i.mkdirsSync(u), t.linkSync(l, p);
  }
  return An = {
    createLink: a(r),
    createLinkSync: c
  }, An;
}
var Cn, za;
function Dc() {
  if (za) return Cn;
  za = 1;
  const a = ye, e = /* @__PURE__ */ je(), { pathExists: t } = /* @__PURE__ */ at(), i = Ie().fromPromise;
  async function n(r, c) {
    if (a.isAbsolute(r)) {
      try {
        await e.lstat(r);
      } catch (u) {
        throw u.message = u.message.replace("lstat", "ensureSymlink"), u;
      }
      return {
        toCwd: r,
        toDst: r
      };
    }
    const l = a.dirname(c), p = a.join(l, r);
    if (await t(p))
      return {
        toCwd: p,
        toDst: r
      };
    try {
      await e.lstat(r);
    } catch (u) {
      throw u.message = u.message.replace("lstat", "ensureSymlink"), u;
    }
    return {
      toCwd: r,
      toDst: a.relative(l, r)
    };
  }
  function s(r, c) {
    if (a.isAbsolute(r)) {
      if (!e.existsSync(r)) throw new Error("absolute srcpath does not exist");
      return {
        toCwd: r,
        toDst: r
      };
    }
    const l = a.dirname(c), p = a.join(l, r);
    if (e.existsSync(p))
      return {
        toCwd: p,
        toDst: r
      };
    if (!e.existsSync(r)) throw new Error("relative srcpath does not exist");
    return {
      toCwd: r,
      toDst: a.relative(l, r)
    };
  }
  return Cn = {
    symlinkPaths: i(n),
    symlinkPathsSync: s
  }, Cn;
}
var On, Ya;
function Ic() {
  if (Ya) return On;
  Ya = 1;
  const a = /* @__PURE__ */ je(), e = Ie().fromPromise;
  async function t(n, s) {
    if (s) return s;
    let r;
    try {
      r = await a.lstat(n);
    } catch {
      return "file";
    }
    return r && r.isDirectory() ? "dir" : "file";
  }
  function i(n, s) {
    if (s) return s;
    let r;
    try {
      r = a.lstatSync(n);
    } catch {
      return "file";
    }
    return r && r.isDirectory() ? "dir" : "file";
  }
  return On = {
    symlinkType: e(t),
    symlinkTypeSync: i
  }, On;
}
var Dn, Wa;
function Pc() {
  if (Wa) return Dn;
  Wa = 1;
  const a = Ie().fromPromise, e = ye, t = /* @__PURE__ */ je(), { mkdirs: i, mkdirsSync: n } = /* @__PURE__ */ $e(), { symlinkPaths: s, symlinkPathsSync: r } = /* @__PURE__ */ Dc(), { symlinkType: c, symlinkTypeSync: l } = /* @__PURE__ */ Ic(), { pathExists: p } = /* @__PURE__ */ at(), { areIdentical: m } = /* @__PURE__ */ ut();
  async function u(v, y, g) {
    let f;
    try {
      f = await t.lstat(y);
    } catch {
    }
    if (f && f.isSymbolicLink()) {
      let E;
      if (e.isAbsolute(v))
        E = await t.stat(v, { bigint: !0 });
      else {
        const A = e.dirname(y), O = e.join(A, v);
        try {
          E = await t.stat(O, { bigint: !0 });
        } catch {
          E = await t.stat(v, { bigint: !0 });
        }
      }
      const w = await t.stat(y, { bigint: !0 });
      if (m(E, w)) return;
    }
    const h = await s(v, y);
    v = h.toDst;
    const b = await c(h.toCwd, g), S = e.dirname(y);
    return await p(S) || await i(S), t.symlink(v, y, b);
  }
  function d(v, y, g) {
    let f;
    try {
      f = t.lstatSync(y);
    } catch {
    }
    if (f && f.isSymbolicLink()) {
      let E;
      if (e.isAbsolute(v))
        E = t.statSync(v, { bigint: !0 });
      else {
        const A = e.dirname(y), O = e.join(A, v);
        try {
          E = t.statSync(O, { bigint: !0 });
        } catch {
          E = t.statSync(v, { bigint: !0 });
        }
      }
      const w = t.statSync(y, { bigint: !0 });
      if (m(E, w)) return;
    }
    const h = r(v, y);
    v = h.toDst, g = l(h.toCwd, g);
    const b = e.dirname(y);
    return t.existsSync(b) || n(b), t.symlinkSync(v, y, g);
  }
  return Dn = {
    createSymlink: a(u),
    createSymlinkSync: d
  }, Dn;
}
var In, Ga;
function Fc() {
  if (Ga) return In;
  Ga = 1;
  const { createFile: a, createFileSync: e } = /* @__PURE__ */ Cc(), { createLink: t, createLinkSync: i } = /* @__PURE__ */ Oc(), { createSymlink: n, createSymlinkSync: s } = /* @__PURE__ */ Pc();
  return In = {
    // file
    createFile: a,
    createFileSync: e,
    ensureFile: a,
    ensureFileSync: e,
    // link
    createLink: t,
    createLinkSync: i,
    ensureLink: t,
    ensureLinkSync: i,
    // symlink
    createSymlink: n,
    createSymlinkSync: s,
    ensureSymlink: n,
    ensureSymlinkSync: s
  }, In;
}
var Pn, Va;
function la() {
  if (Va) return Pn;
  Va = 1;
  function a(t, { EOL: i = `
`, finalEOL: n = !0, replacer: s = null, spaces: r } = {}) {
    const c = n ? i : "", l = JSON.stringify(t, s, r);
    if (l === void 0)
      throw new TypeError(`Converting ${typeof t} value to JSON is not supported`);
    return l.replace(/\n/g, i) + c;
  }
  function e(t) {
    return Buffer.isBuffer(t) && (t = t.toString("utf8")), t.replace(/^\uFEFF/, "");
  }
  return Pn = { stringify: a, stripBom: e }, Pn;
}
var Fn, Ja;
function Lc() {
  if (Ja) return Fn;
  Ja = 1;
  let a;
  try {
    a = _t();
  } catch {
    a = aa;
  }
  const e = Ie(), { stringify: t, stripBom: i } = la();
  async function n(m, u = {}) {
    typeof u == "string" && (u = { encoding: u });
    const d = u.fs || a, v = "throws" in u ? u.throws : !0;
    let y = await e.fromCallback(d.readFile)(m, u);
    y = i(y);
    let g;
    try {
      g = JSON.parse(y, u ? u.reviver : null);
    } catch (f) {
      if (v)
        throw f.message = `${m}: ${f.message}`, f;
      return null;
    }
    return g;
  }
  const s = e.fromPromise(n);
  function r(m, u = {}) {
    typeof u == "string" && (u = { encoding: u });
    const d = u.fs || a, v = "throws" in u ? u.throws : !0;
    try {
      let y = d.readFileSync(m, u);
      return y = i(y), JSON.parse(y, u.reviver);
    } catch (y) {
      if (v)
        throw y.message = `${m}: ${y.message}`, y;
      return null;
    }
  }
  async function c(m, u, d = {}) {
    const v = d.fs || a, y = t(u, d);
    await e.fromCallback(v.writeFile)(m, y, d);
  }
  const l = e.fromPromise(c);
  function p(m, u, d = {}) {
    const v = d.fs || a, y = t(u, d);
    return v.writeFileSync(m, y, d);
  }
  return Fn = {
    readFile: s,
    readFileSync: r,
    writeFile: l,
    writeFileSync: p
  }, Fn;
}
var Ln, Xa;
function Nc() {
  if (Xa) return Ln;
  Xa = 1;
  const a = Lc();
  return Ln = {
    // jsonfile exports
    readJson: a.readFile,
    readJsonSync: a.readFileSync,
    writeJson: a.writeFile,
    writeJsonSync: a.writeFileSync
  }, Ln;
}
var Nn, Qa;
function ua() {
  if (Qa) return Nn;
  Qa = 1;
  const a = Ie().fromPromise, e = /* @__PURE__ */ je(), t = ye, i = /* @__PURE__ */ $e(), n = at().pathExists;
  async function s(c, l, p = "utf-8") {
    const m = t.dirname(c);
    return await n(m) || await i.mkdirs(m), e.writeFile(c, l, p);
  }
  function r(c, ...l) {
    const p = t.dirname(c);
    e.existsSync(p) || i.mkdirsSync(p), e.writeFileSync(c, ...l);
  }
  return Nn = {
    outputFile: a(s),
    outputFileSync: r
  }, Nn;
}
var jn, Za;
function jc() {
  if (Za) return jn;
  Za = 1;
  const { stringify: a } = la(), { outputFile: e } = /* @__PURE__ */ ua();
  async function t(i, n, s = {}) {
    const r = a(n, s);
    await e(i, r, s);
  }
  return jn = t, jn;
}
var Mn, er;
function Mc() {
  if (er) return Mn;
  er = 1;
  const { stringify: a } = la(), { outputFileSync: e } = /* @__PURE__ */ ua();
  function t(i, n, s) {
    const r = a(n, s);
    e(i, r, s);
  }
  return Mn = t, Mn;
}
var Un, tr;
function Uc() {
  if (tr) return Un;
  tr = 1;
  const a = Ie().fromPromise, e = /* @__PURE__ */ Nc();
  return e.outputJson = a(/* @__PURE__ */ jc()), e.outputJsonSync = /* @__PURE__ */ Mc(), e.outputJSON = e.outputJson, e.outputJSONSync = e.outputJsonSync, e.writeJSON = e.writeJson, e.writeJSONSync = e.writeJsonSync, e.readJSON = e.readJson, e.readJSONSync = e.readJsonSync, Un = e, Un;
}
var qn, nr;
function qc() {
  if (nr) return qn;
  nr = 1;
  const a = /* @__PURE__ */ je(), e = ye, { copy: t } = /* @__PURE__ */ ca(), { remove: i } = /* @__PURE__ */ Xt(), { mkdirp: n } = /* @__PURE__ */ $e(), { pathExists: s } = /* @__PURE__ */ at(), r = /* @__PURE__ */ ut();
  async function c(m, u, d = {}) {
    const v = d.overwrite || d.clobber || !1, { srcStat: y, isChangingCase: g = !1 } = await r.checkPaths(m, u, "move", d);
    await r.checkParentPaths(m, y, u, "move");
    const f = e.dirname(u);
    return e.parse(f).root !== f && await n(f), l(m, u, v, g);
  }
  async function l(m, u, d, v) {
    if (!v) {
      if (d)
        await i(u);
      else if (await s(u))
        throw new Error("dest already exists.");
    }
    try {
      await a.rename(m, u);
    } catch (y) {
      if (y.code !== "EXDEV")
        throw y;
      await p(m, u, d);
    }
  }
  async function p(m, u, d) {
    return await t(m, u, {
      overwrite: d,
      errorOnExist: !0,
      preserveTimestamps: !0
    }), i(m);
  }
  return qn = c, qn;
}
var Bn, ir;
function Bc() {
  if (ir) return Bn;
  ir = 1;
  const a = _t(), e = ye, t = ca().copySync, i = Xt().removeSync, n = $e().mkdirpSync, s = /* @__PURE__ */ ut();
  function r(u, d, v) {
    v = v || {};
    const y = v.overwrite || v.clobber || !1, { srcStat: g, isChangingCase: f = !1 } = s.checkPathsSync(u, d, "move", v);
    return s.checkParentPathsSync(u, g, d, "move"), c(d) || n(e.dirname(d)), l(u, d, y, f);
  }
  function c(u) {
    const d = e.dirname(u);
    return e.parse(d).root === d;
  }
  function l(u, d, v, y) {
    if (y) return p(u, d, v);
    if (v)
      return i(d), p(u, d, v);
    if (a.existsSync(d)) throw new Error("dest already exists.");
    return p(u, d, v);
  }
  function p(u, d, v) {
    try {
      a.renameSync(u, d);
    } catch (y) {
      if (y.code !== "EXDEV") throw y;
      return m(u, d, v);
    }
  }
  function m(u, d, v) {
    return t(u, d, {
      overwrite: v,
      errorOnExist: !0,
      preserveTimestamps: !0
    }), i(u);
  }
  return Bn = r, Bn;
}
var Hn, ar;
function Hc() {
  if (ar) return Hn;
  ar = 1;
  const a = Ie().fromPromise;
  return Hn = {
    move: a(/* @__PURE__ */ qc()),
    moveSync: /* @__PURE__ */ Bc()
  }, Hn;
}
var $n, rr;
function $c() {
  return rr || (rr = 1, $n = {
    // Export promiseified graceful-fs:
    .../* @__PURE__ */ je(),
    // Export extra methods:
    .../* @__PURE__ */ ca(),
    .../* @__PURE__ */ Ac(),
    .../* @__PURE__ */ Fc(),
    .../* @__PURE__ */ Uc(),
    .../* @__PURE__ */ $e(),
    .../* @__PURE__ */ Hc(),
    .../* @__PURE__ */ ua(),
    .../* @__PURE__ */ at(),
    .../* @__PURE__ */ Xt()
  }), $n;
}
var Kc = /* @__PURE__ */ $c();
const Xe = /* @__PURE__ */ Jt(Kc);
class zc {
  constructor() {
    ue(this, "db", null);
    ue(this, "dbPath");
    const e = Le ? Le.getPath("userData") : ye.join(process.cwd(), "data");
    Xe.ensureDirSync(e), this.dbPath = ye.join(e, "hid-framework.db");
  }
  init() {
    if (this.db) return;
    this.db = new mc(this.dbPath), this.db.pragma("journal_mode = WAL"), this.db.pragma("foreign_keys = ON");
    const e = ye.join(__dirname, "schema.sql"), t = Xe.readFileSync(e, "utf-8");
    this.db.exec(t);
  }
  close() {
    this.db && (this.db.close(), this.db = null);
  }
  getDb() {
    if (!this.db)
      throw new Error("Database not initialized. Call init() first.");
    return this.db;
  }
  mapDevice(e) {
    return {
      id: e.id,
      vendorId: parseInt(e.vendor_id, 16),
      productId: parseInt(e.product_id, 16),
      manufacturer: e.manufacturer || "",
      productName: e.product_name || "",
      serialNumber: e.serial_number || "",
      devicePath: e.device_path,
      firstSeen: new Date(e.first_seen),
      lastSeen: new Date(e.last_seen),
      isBlocked: e.is_blocked === 1,
      trustScore: e.trust_score
    };
  }
  mapEvent(e, t) {
    return {
      id: e.id.toString(),
      timestamp: new Date(e.timestamp),
      devicePath: "",
      device: t,
      type: e.event_type,
      keyCode: e.key_code ?? void 0,
      keyName: e.key_name ?? void 0,
      modifiers: e.modifiers ? JSON.parse(e.modifiers) : void 0,
      mouseX: e.mouse_x ?? void 0,
      mouseY: e.mouse_y ?? void 0,
      rawData: e.raw_data ? JSON.parse(e.raw_data) : [],
      processingTimeMs: e.processing_time_ms ?? void 0
    };
  }
  mapAlert(e, t, i, n) {
    return {
      id: e.id.toString(),
      timestamp: new Date(e.timestamp),
      device: t,
      deviceId: e.device_id ?? void 0,
      severity: e.severity,
      reason: e.reason,
      matchedSignatures: i,
      inputSequence: n,
      riskScore: e.risk_score,
      inputSequenceHash: e.input_sequence_hash ?? void 0,
      isReviewed: e.is_reviewed === 1,
      reviewNotes: e.review_notes ?? void 0,
      reviewedAt: e.reviewed_at ? new Date(e.reviewed_at) : void 0
    };
  }
  mapSignature(e) {
    return {
      id: e.id.toString(),
      signatureId: e.signature_id,
      name: e.name,
      description: e.description || "",
      severity: e.severity,
      pattern: {},
      patternYaml: e.pattern_yaml,
      createdAt: new Date(e.created_at),
      updatedAt: new Date(e.updated_at),
      source: e.source
    };
  }
  mapVTScan(e) {
    return {
      id: e.id,
      payloadId: e.payload_id ?? void 0,
      scanId: e.scan_id,
      permalink: e.permalink || "",
      positives: e.positives,
      total: e.total,
      detectionRate: e.detection_rate,
      scans: e.scans_json ? JSON.parse(e.scans_json) : {},
      scanDate: e.scan_date ? new Date(e.scan_date) : /* @__PURE__ */ new Date()
    };
  }
  mapPayload(e) {
    return {
      id: e.id,
      originalScript: e.original_script || "",
      targetDevice: e.target_device,
      outputPath: e.output_path ?? void 0,
      fileHash: e.file_hash ?? void 0,
      compiledAt: new Date(e.compiled_at),
      paramsJson: e.params_json || ""
    };
  }
  addDevice(e) {
    return this.getDb().prepare(`
      INSERT OR REPLACE INTO detected_devices 
      (vendor_id, product_id, manufacturer, product_name, serial_number, device_path, first_seen, last_seen, is_blocked, trust_score)
      VALUES (@vendorId, @productId, @manufacturer, @productName, @serialNumber, @devicePath, @firstSeen, @lastSeen, @isBlocked, @trustScore)
    `).run({
      vendorId: "0x" + e.vendorId.toString(16).padStart(4, "0"),
      productId: "0x" + e.productId.toString(16).padStart(4, "0"),
      manufacturer: e.manufacturer,
      productName: e.productName,
      serialNumber: e.serialNumber,
      devicePath: e.devicePath,
      firstSeen: e.firstSeen instanceof Date ? e.firstSeen.toISOString() : e.firstSeen,
      lastSeen: e.lastSeen ? e.lastSeen instanceof Date ? e.lastSeen.toISOString() : e.lastSeen : (/* @__PURE__ */ new Date()).toISOString(),
      isBlocked: e.isBlocked ? 1 : 0,
      trustScore: e.trustScore ?? 50
    }).lastInsertRowid;
  }
  updateDeviceLastSeen(e) {
    this.getDb().prepare(`
      UPDATE detected_devices 
      SET last_seen = @lastSeen 
      WHERE device_path = @devicePath
    `).run({
      lastSeen: (/* @__PURE__ */ new Date()).toISOString(),
      devicePath: e
    });
  }
  getDeviceById(e) {
    const n = this.getDb().prepare("SELECT * FROM detected_devices WHERE id = @id").get({ id: e });
    return n ? this.mapDevice(n) : null;
  }
  getDeviceByPath(e) {
    const n = this.getDb().prepare("SELECT * FROM detected_devices WHERE device_path = @devicePath").get({ devicePath: e });
    return n ? this.mapDevice(n) : null;
  }
  getAllDevices() {
    return this.getDb().prepare("SELECT * FROM detected_devices ORDER BY last_seen DESC").all().map((n) => this.mapDevice(n));
  }
  updateDeviceTrustScore(e, t) {
    this.getDb().prepare(`
      UPDATE detected_devices 
      SET trust_score = @trustScore 
      WHERE id = @id
    `).run({ id: e, trustScore: t });
  }
  setDeviceBlocked(e, t) {
    this.getDb().prepare(`
      UPDATE detected_devices 
      SET is_blocked = @isBlocked 
      WHERE id = @id
    `).run({ id: e, isBlocked: t ? 1 : 0 });
  }
  deleteDevice(e) {
    const t = this.getDb();
    t.transaction(() => {
      t.prepare("DELETE FROM input_events WHERE device_id = @id").run({ id: e }), t.prepare("DELETE FROM detection_alerts WHERE device_id = @id").run({ id: e }), t.prepare("DELETE FROM detected_devices WHERE id = @id").run({ id: e });
    })();
  }
  addEvent(e) {
    return this.getDb().prepare(`
      INSERT INTO input_events 
      (device_id, alert_id, timestamp, event_type, key_code, key_name, modifiers, mouse_x, mouse_y, raw_data, processing_time_ms)
      VALUES (@deviceId, @alertId, @timestamp, @eventType, @keyCode, @keyName, @modifiers, @mouseX, @mouseY, @rawData, @processingTimeMs)
    `).run({
      deviceId: e.deviceId ?? null,
      alertId: e.alertId ?? null,
      timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
      eventType: e.type,
      keyCode: e.keyCode ?? null,
      keyName: e.keyName ?? null,
      modifiers: e.modifiers ? JSON.stringify(e.modifiers) : null,
      mouseX: e.mouseX ?? null,
      mouseY: e.mouseY ?? null,
      rawData: JSON.stringify(e.rawData),
      processingTimeMs: e.processingTimeMs ?? null
    }).lastInsertRowid;
  }
  getEventById(e) {
    const n = this.getDb().prepare(`
      SELECT e.*, d.* as device_data
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
      WHERE e.id = @id
    `).get({ id: e });
    if (!n) return null;
    const s = {
      id: n.id,
      device_id: n.device_id,
      alert_id: n.alert_id,
      timestamp: n.timestamp,
      event_type: n.event_type,
      key_code: n.key_code,
      key_name: n.key_name,
      modifiers: n.modifiers,
      mouse_x: n.mouse_x,
      mouse_y: n.mouse_y,
      raw_data: n.raw_data,
      processing_time_ms: n.processing_time_ms
    };
    let r;
    if (n.device_id) {
      const c = {
        id: n.device_id,
        vendor_id: n.vendor_id,
        product_id: n.product_id,
        manufacturer: n.manufacturer,
        product_name: n.product_name,
        serial_number: n.serial_number,
        device_path: n.device_path,
        first_seen: n.first_seen,
        last_seen: n.last_seen,
        is_blocked: n.is_blocked,
        trust_score: n.trust_score
      };
      r = this.mapDevice(c);
    }
    return this.mapEvent(s, r);
  }
  getEventsByDeviceId(e, t = 100) {
    const i = this.getDb(), n = this.getDeviceById(e);
    return n ? i.prepare(`
      SELECT * FROM input_events 
      WHERE device_id = @deviceId 
      ORDER BY timestamp DESC 
      LIMIT @limit
    `).all({ deviceId: e, limit: t }).map((c) => this.mapEvent(c, n)) : [];
  }
  getEventsByAlertId(e) {
    return this.getDb().prepare(`
      SELECT e.*, d.*
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
      WHERE e.alert_id = @alertId 
      ORDER BY e.timestamp ASC
    `).all({ alertId: e }).map((s) => {
      const r = {
        id: s.id,
        device_id: s.device_id,
        alert_id: s.alert_id,
        timestamp: s.timestamp,
        event_type: s.event_type,
        key_code: s.key_code,
        key_name: s.key_name,
        modifiers: s.modifiers,
        mouse_x: s.mouse_x,
        mouse_y: s.mouse_y,
        raw_data: s.raw_data,
        processing_time_ms: s.processing_time_ms
      };
      let c;
      if (s.device_id) {
        const l = {
          id: s.device_id,
          vendor_id: s.vendor_id,
          product_id: s.product_id,
          manufacturer: s.manufacturer,
          product_name: s.product_name,
          serial_number: s.serial_number,
          device_path: s.device_path,
          first_seen: s.first_seen,
          last_seen: s.last_seen,
          is_blocked: s.is_blocked,
          trust_score: s.trust_score
        };
        c = this.mapDevice(l);
      }
      return this.mapEvent(r, c);
    });
  }
  queryEvents(e) {
    const t = this.getDb(), i = [], n = {};
    e.startDate && (i.push("e.timestamp >= @startDate"), n.startDate = e.startDate.toISOString()), e.endDate && (i.push("e.timestamp <= @endDate"), n.endDate = e.endDate.toISOString()), e.devicePath && (i.push("d.device_path = @devicePath"), n.devicePath = e.devicePath);
    let s = `
      SELECT e.*, d.*
      FROM input_events e
      LEFT JOIN detected_devices d ON e.device_id = d.id
    `;
    return i.length > 0 && (s += " WHERE " + i.join(" AND ")), s += " ORDER BY e.timestamp DESC", e.limit && (s += " LIMIT @limit", n.limit = e.limit), e.offset && (s += " OFFSET @offset", n.offset = e.offset), t.prepare(s).all(n).map((l) => {
      const p = {
        id: l.id,
        device_id: l.device_id,
        alert_id: l.alert_id,
        timestamp: l.timestamp,
        event_type: l.event_type,
        key_code: l.key_code,
        key_name: l.key_name,
        modifiers: l.modifiers,
        mouse_x: l.mouse_x,
        mouse_y: l.mouse_y,
        raw_data: l.raw_data,
        processing_time_ms: l.processing_time_ms
      };
      let m;
      if (l.device_id) {
        const u = {
          id: l.device_id,
          vendor_id: l.vendor_id,
          product_id: l.product_id,
          manufacturer: l.manufacturer,
          product_name: l.product_name,
          serial_number: l.serial_number,
          device_path: l.device_path,
          first_seen: l.first_seen,
          last_seen: l.last_seen,
          is_blocked: l.is_blocked,
          trust_score: l.trust_score
        };
        m = this.mapDevice(u);
      }
      return this.mapEvent(p, m);
    });
  }
  deleteEvent(e) {
    this.getDb().prepare("DELETE FROM input_events WHERE id = @id").run({ id: e });
  }
  addAlert(e) {
    const t = this.getDb();
    return t.transaction(() => {
      const r = t.prepare(`
        INSERT INTO detection_alerts 
        (device_id, timestamp, severity, reason, risk_score, input_sequence_hash, is_reviewed, review_notes, reviewed_at)
        VALUES (@deviceId, @timestamp, @severity, @reason, @riskScore, @inputSequenceHash, @isReviewed, @reviewNotes, @reviewedAt)
      `).run({
        deviceId: e.deviceId ?? null,
        timestamp: e.timestamp instanceof Date ? e.timestamp.toISOString() : e.timestamp,
        severity: e.severity,
        reason: e.reason,
        riskScore: e.riskScore,
        inputSequenceHash: e.inputSequenceHash ?? null,
        isReviewed: e.isReviewed ? 1 : 0,
        reviewNotes: e.reviewNotes ?? null,
        reviewedAt: e.reviewedAt ? e.reviewedAt instanceof Date ? e.reviewedAt.toISOString() : e.reviewedAt : null
      }).lastInsertRowid;
      if (e.matchedSignatures && e.matchedSignatures.length > 0) {
        const c = t.prepare(`
          INSERT INTO alert_signatures (alert_id, signature_id, matched_at)
          VALUES (@alertId, (SELECT id FROM attack_signatures WHERE signature_id = @signatureId), @matchedAt)
        `);
        for (const l of e.matchedSignatures)
          c.run({
            alertId: r,
            signatureId: l,
            matchedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
      }
      if (e.inputSequence && e.inputSequence.length > 0) {
        const c = t.prepare(`
          INSERT INTO input_events 
          (device_id, alert_id, timestamp, event_type, key_code, key_name, modifiers, mouse_x, mouse_y, raw_data, processing_time_ms)
          VALUES (@deviceId, @alertId, @timestamp, @eventType, @keyCode, @keyName, @modifiers, @mouseX, @mouseY, @rawData, @processingTimeMs)
        `);
        for (const l of e.inputSequence)
          c.run({
            deviceId: e.deviceId ?? null,
            alertId: r,
            timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : l.timestamp,
            eventType: l.type,
            keyCode: l.keyCode ?? null,
            keyName: l.keyName ?? null,
            modifiers: l.modifiers ? JSON.stringify(l.modifiers) : null,
            mouseX: l.mouseX ?? null,
            mouseY: l.mouseY ?? null,
            rawData: JSON.stringify(l.rawData),
            processingTimeMs: l.processingTimeMs ?? null
          });
      }
      return r;
    })();
  }
  getAlertById(e) {
    const t = this.getDb(), n = t.prepare(`
      SELECT a.*, d.*
      FROM detection_alerts a
      LEFT JOIN detected_devices d ON a.device_id = d.id
      WHERE a.id = @id
    `).get({ id: e });
    if (!n) return null;
    const s = {
      id: n.id,
      device_id: n.device_id,
      timestamp: n.timestamp,
      severity: n.severity,
      reason: n.reason,
      risk_score: n.risk_score,
      input_sequence_hash: n.input_sequence_hash,
      is_reviewed: n.is_reviewed,
      review_notes: n.review_notes,
      reviewed_at: n.reviewed_at
    };
    let r;
    if (n.device_id) {
      const u = {
        id: n.device_id,
        vendor_id: n.vendor_id,
        product_id: n.product_id,
        manufacturer: n.manufacturer,
        product_name: n.product_name,
        serial_number: n.serial_number,
        device_path: n.device_path,
        first_seen: n.first_seen,
        last_seen: n.last_seen,
        is_blocked: n.is_blocked,
        trust_score: n.trust_score
      };
      r = this.mapDevice(u);
    } else
      r = {};
    const p = t.prepare(`
      SELECT s.signature_id
      FROM alert_signatures als
      JOIN attack_signatures s ON als.signature_id = s.id
      WHERE als.alert_id = @alertId
    `).all({ alertId: e }).map((u) => u.signature_id), m = this.getEventsByAlertId(e);
    return this.mapAlert(s, r, p, m);
  }
  queryAlerts(e) {
    const t = this.getDb(), i = [], n = {};
    e.severity && e.severity.length > 0 && (i.push(`a.severity IN (${e.severity.map((l, p) => `@severity${p}`).join(", ")})`), e.severity.forEach((l, p) => {
      n[`severity${p}`] = l;
    })), e.startDate && (i.push("a.timestamp >= @startDate"), n.startDate = e.startDate.toISOString()), e.endDate && (i.push("a.timestamp <= @endDate"), n.endDate = e.endDate.toISOString()), e.devicePath && (i.push("d.device_path = @devicePath"), n.devicePath = e.devicePath), e.reviewed !== void 0 && (i.push("a.is_reviewed = @isReviewed"), n.isReviewed = e.reviewed ? 1 : 0);
    let s = `
      SELECT a.*, d.*
      FROM detection_alerts a
      LEFT JOIN detected_devices d ON a.device_id = d.id
    `;
    return i.length > 0 && (s += " WHERE " + i.join(" AND ")), s += " ORDER BY a.timestamp DESC", e.limit && (s += " LIMIT @limit", n.limit = e.limit), e.offset && (s += " OFFSET @offset", n.offset = e.offset), t.prepare(s).all(n).map((l) => {
      const p = {
        id: l.id,
        device_id: l.device_id,
        timestamp: l.timestamp,
        severity: l.severity,
        reason: l.reason,
        risk_score: l.risk_score,
        input_sequence_hash: l.input_sequence_hash,
        is_reviewed: l.is_reviewed,
        review_notes: l.review_notes,
        reviewed_at: l.reviewed_at
      };
      let m;
      if (l.device_id) {
        const g = {
          id: l.device_id,
          vendor_id: l.vendor_id,
          product_id: l.product_id,
          manufacturer: l.manufacturer,
          product_name: l.product_name,
          serial_number: l.serial_number,
          device_path: l.device_path,
          first_seen: l.first_seen,
          last_seen: l.last_seen,
          is_blocked: l.is_blocked,
          trust_score: l.trust_score
        };
        m = this.mapDevice(g);
      } else
        m = {};
      const v = t.prepare(`
        SELECT s.signature_id
        FROM alert_signatures als
        JOIN attack_signatures s ON als.signature_id = s.id
        WHERE als.alert_id = @alertId
      `).all({ alertId: l.id }).map((g) => g.signature_id), y = this.getEventsByAlertId(l.id);
      return this.mapAlert(p, m, v, y);
    });
  }
  markAlertAsReviewed(e, t) {
    this.getDb().prepare(`
      UPDATE detection_alerts 
      SET is_reviewed = 1, review_notes = @reviewNotes, reviewed_at = @reviewedAt
      WHERE id = @id
    `).run({
      id: e,
      reviewNotes: t ?? null,
      reviewedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  deleteAlert(e) {
    const t = this.getDb();
    t.transaction(() => {
      t.prepare("DELETE FROM alert_signatures WHERE alert_id = @id").run({ id: e }), t.prepare("DELETE FROM input_events WHERE alert_id = @id").run({ id: e }), t.prepare("DELETE FROM detection_alerts WHERE id = @id").run({ id: e });
    })();
  }
  addSignature(e) {
    return this.getDb().prepare(`
      INSERT OR REPLACE INTO attack_signatures 
      (signature_id, name, description, severity, pattern_yaml, created_at, updated_at, source)
      VALUES (@signatureId, @name, @description, @severity, @patternYaml, @createdAt, @updatedAt, @source)
    `).run({
      signatureId: e.signatureId,
      name: e.name,
      description: e.description || null,
      severity: e.severity,
      patternYaml: e.patternYaml,
      createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
      updatedAt: e.updatedAt instanceof Date ? e.updatedAt.toISOString() : e.updatedAt,
      source: e.source
    }).lastInsertRowid;
  }
  getSignatureById(e) {
    const n = this.getDb().prepare("SELECT * FROM attack_signatures WHERE id = @id").get({ id: e });
    return n ? this.mapSignature(n) : null;
  }
  getSignatureBySignatureId(e) {
    const n = this.getDb().prepare("SELECT * FROM attack_signatures WHERE signature_id = @signatureId").get({ signatureId: e });
    return n ? this.mapSignature(n) : null;
  }
  getAllSignatures() {
    return this.getDb().prepare("SELECT * FROM attack_signatures ORDER BY created_at DESC").all().map((n) => this.mapSignature(n));
  }
  updateSignature(e, t) {
    const i = this.getDb(), n = [], s = { id: e };
    t.name !== void 0 && (n.push("name = @name"), s.name = t.name), t.description !== void 0 && (n.push("description = @description"), s.description = t.description || null), t.severity !== void 0 && (n.push("severity = @severity"), s.severity = t.severity), t.patternYaml !== void 0 && (n.push("pattern_yaml = @patternYaml"), s.patternYaml = t.patternYaml), t.source !== void 0 && (n.push("source = @source"), s.source = t.source), n.push("updated_at = @updatedAt"), s.updatedAt = (/* @__PURE__ */ new Date()).toISOString(), i.prepare(`
      UPDATE attack_signatures 
      SET ${n.join(", ")}
      WHERE id = @id
    `).run(s);
  }
  deleteSignature(e) {
    const t = this.getDb();
    t.transaction(() => {
      t.prepare("DELETE FROM alert_signatures WHERE signature_id = @id").run({ id: e }), t.prepare("DELETE FROM attack_signatures WHERE id = @id").run({ id: e });
    })();
  }
  addVTScan(e) {
    return this.getDb().prepare(`
      INSERT OR REPLACE INTO virustotal_scans 
      (payload_id, scan_id, permalink, positives, total, detection_rate, scans_json, scan_date)
      VALUES (@payloadId, @scanId, @permalink, @positives, @total, @detectionRate, @scansJson, @scanDate)
    `).run({
      payloadId: e.payloadId ?? null,
      scanId: e.scanId,
      permalink: e.permalink || null,
      positives: e.positives,
      total: e.total,
      detectionRate: e.detectionRate,
      scansJson: JSON.stringify(e.scans),
      scanDate: e.scanDate instanceof Date ? e.scanDate.toISOString() : e.scanDate
    }).lastInsertRowid;
  }
  getVTScanById(e) {
    const n = this.getDb().prepare("SELECT * FROM virustotal_scans WHERE id = @id").get({ id: e });
    return n ? this.mapVTScan(n) : null;
  }
  getVTScanByScanId(e) {
    const n = this.getDb().prepare("SELECT * FROM virustotal_scans WHERE scan_id = @scanId").get({ scanId: e });
    return n ? this.mapVTScan(n) : null;
  }
  getVTScanByPayloadId(e) {
    return this.getDb().prepare("SELECT * FROM virustotal_scans WHERE payload_id = @payloadId ORDER BY scan_date DESC").all({ payloadId: e }).map((s) => this.mapVTScan(s));
  }
  getAllVTScan() {
    return this.getDb().prepare("SELECT * FROM virustotal_scans ORDER BY scan_date DESC").all().map((n) => this.mapVTScan(n));
  }
  updateVTScan(e, t) {
    const i = this.getDb(), n = [], s = { id: e };
    t.payloadId !== void 0 && (n.push("payload_id = @payloadId"), s.payloadId = t.payloadId ?? null), t.permalink !== void 0 && (n.push("permalink = @permalink"), s.permalink = t.permalink || null), t.positives !== void 0 && (n.push("positives = @positives"), s.positives = t.positives), t.total !== void 0 && (n.push("total = @total"), s.total = t.total), t.detectionRate !== void 0 && (n.push("detection_rate = @detectionRate"), s.detectionRate = t.detectionRate), t.scans !== void 0 && (n.push("scans_json = @scansJson"), s.scansJson = JSON.stringify(t.scans)), t.scanDate !== void 0 && (n.push("scan_date = @scanDate"), s.scanDate = t.scanDate instanceof Date ? t.scanDate.toISOString() : t.scanDate), i.prepare(`
      UPDATE virustotal_scans 
      SET ${n.join(", ")}
      WHERE id = @id
    `).run(s);
  }
  deleteVTScan(e) {
    this.getDb().prepare("DELETE FROM virustotal_scans WHERE id = @id").run({ id: e });
  }
  addPayload(e) {
    return this.getDb().prepare(`
      INSERT INTO compiled_payloads 
      (original_script, target_device, output_path, file_hash, compiled_at, params_json)
      VALUES (@originalScript, @targetDevice, @outputPath, @fileHash, @compiledAt, @paramsJson)
    `).run({
      originalScript: e.originalScript || null,
      targetDevice: e.targetDevice,
      outputPath: e.outputPath ?? null,
      fileHash: e.fileHash ?? null,
      compiledAt: e.compiledAt instanceof Date ? e.compiledAt.toISOString() : e.compiledAt,
      paramsJson: e.paramsJson || null
    }).lastInsertRowid;
  }
  getPayloadById(e) {
    const n = this.getDb().prepare("SELECT * FROM compiled_payloads WHERE id = @id").get({ id: e });
    return n ? this.mapPayload(n) : null;
  }
  getAllPayloads() {
    return this.getDb().prepare("SELECT * FROM compiled_payloads ORDER BY compiled_at DESC").all().map((n) => this.mapPayload(n));
  }
  deletePayload(e) {
    const t = this.getDb();
    t.transaction(() => {
      t.prepare("DELETE FROM virustotal_scans WHERE payload_id = @id").run({ id: e }), t.prepare("DELETE FROM compiled_payloads WHERE id = @id").run({ id: e });
    })();
  }
  getSettings() {
    const i = this.getDb().prepare("SELECT * FROM app_settings WHERE id = 1").get();
    if (!i)
      throw new Error("Settings not found. Database may not be properly initialized.");
    return JSON.parse(i.settings_json);
  }
  updateSettings(e) {
    const t = this.getDb(), i = this.getSettings(), n = {
      ...i,
      ...e,
      detection: {
        ...i.detection,
        ...e.detection
      },
      virustotal: {
        ...i.virustotal,
        ...e.virustotal
      },
      signatures: {
        ...i.signatures,
        ...e.signatures
      },
      service: {
        ...i.service,
        ...e.service
      }
    };
    t.prepare(`
      UPDATE app_settings 
      SET settings_json = @settingsJson, updated_at = @updatedAt
      WHERE id = 1
    `).run({
      settingsJson: JSON.stringify(n),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  setSettings(e) {
    this.getDb().prepare(`
      UPDATE app_settings 
      SET settings_json = @settingsJson, updated_at = @updatedAt
      WHERE id = 1
    `).run({
      settingsJson: JSON.stringify(e),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
}
const ge = new zc();
/*! js-yaml 4.2.0 https://github.com/nodeca/js-yaml @license MIT */
var Yc = Object.create, eo = Object.defineProperty, Wc = Object.getOwnPropertyDescriptor, Gc = Object.getOwnPropertyNames, Vc = Object.getPrototypeOf, Jc = Object.prototype.hasOwnProperty, Se = (a, e) => () => (e || (a((e = { exports: {} }).exports, e), a = null), e.exports), Xc = (a, e, t, i) => {
  if (e && typeof e == "object" || typeof e == "function") for (var n = Gc(e), s = 0, r = n.length, c; s < r; s++)
    c = n[s], !Jc.call(a, c) && c !== t && eo(a, c, {
      get: ((l) => e[l]).bind(null, c),
      enumerable: !(i = Wc(e, c)) || i.enumerable
    });
  return a;
}, Qc = (a, e, t) => (t = a != null ? Yc(Vc(a)) : {}, Xc(eo(t, "default", {
  value: a,
  enumerable: !0
}), a)), wt = /* @__PURE__ */ Se(((a, e) => {
  function t(l) {
    return typeof l > "u" || l === null;
  }
  function i(l) {
    return typeof l == "object" && l !== null;
  }
  function n(l) {
    return Array.isArray(l) ? l : t(l) ? [] : [l];
  }
  function s(l, p) {
    if (p) {
      const m = Object.keys(p);
      for (let u = 0, d = m.length; u < d; u += 1) {
        const v = m[u];
        l[v] = p[v];
      }
    }
    return l;
  }
  function r(l, p) {
    let m = "";
    for (let u = 0; u < p; u += 1) m += l;
    return m;
  }
  function c(l) {
    return l === 0 && Number.NEGATIVE_INFINITY === 1 / l;
  }
  e.exports.isNothing = t, e.exports.isObject = i, e.exports.toArray = n, e.exports.repeat = r, e.exports.isNegativeZero = c, e.exports.extend = s;
})), Et = /* @__PURE__ */ Se(((a, e) => {
  function t(n, s) {
    let r = "";
    const c = n.reason || "(unknown reason)";
    return n.mark ? (n.mark.name && (r += 'in "' + n.mark.name + '" '), r += "(" + (n.mark.line + 1) + ":" + (n.mark.column + 1) + ")", !s && n.mark.snippet && (r += `

` + n.mark.snippet), c + " " + r) : c;
  }
  function i(n, s) {
    Error.call(this), this.name = "YAMLException", this.reason = n, this.mark = s, this.message = t(this, !1), Error.captureStackTrace ? Error.captureStackTrace(this, this.constructor) : this.stack = (/* @__PURE__ */ new Error()).stack || "";
  }
  i.prototype = Object.create(Error.prototype), i.prototype.constructor = i, i.prototype.toString = function(s) {
    return this.name + ": " + t(this, s);
  }, e.exports = i;
})), Zc = /* @__PURE__ */ Se(((a, e) => {
  var t = wt();
  function i(r, c, l, p, m) {
    let u = "", d = "";
    const v = Math.floor(m / 2) - 1;
    return p - c > v && (u = " ... ", c = p - v + u.length), l - p > v && (d = " ...", l = p + v - d.length), {
      str: u + r.slice(c, l).replace(/\t/g, "→") + d,
      pos: p - c + u.length
    };
  }
  function n(r, c) {
    return t.repeat(" ", c - r.length) + r;
  }
  function s(r, c) {
    if (c = Object.create(c || null), !r.buffer) return null;
    c.maxLength || (c.maxLength = 79), typeof c.indent != "number" && (c.indent = 1), typeof c.linesBefore != "number" && (c.linesBefore = 3), typeof c.linesAfter != "number" && (c.linesAfter = 2);
    const l = /\r?\n|\r|\0/g, p = [0], m = [];
    let u, d = -1;
    for (; u = l.exec(r.buffer); )
      m.push(u.index), p.push(u.index + u[0].length), r.position <= u.index && d < 0 && (d = p.length - 2);
    d < 0 && (d = p.length - 1);
    let v = "";
    const y = Math.min(r.line + c.linesAfter, m.length).toString().length, g = c.maxLength - (c.indent + y + 3);
    for (let h = 1; h <= c.linesBefore && !(d - h < 0); h++) {
      const b = i(r.buffer, p[d - h], m[d - h], r.position - (p[d] - p[d - h]), g);
      v = t.repeat(" ", c.indent) + n((r.line - h + 1).toString(), y) + " | " + b.str + `
` + v;
    }
    const f = i(r.buffer, p[d], m[d], r.position, g);
    v += t.repeat(" ", c.indent) + n((r.line + 1).toString(), y) + " | " + f.str + `
`, v += t.repeat("-", c.indent + y + 3 + f.pos) + `^
`;
    for (let h = 1; h <= c.linesAfter && !(d + h >= m.length); h++) {
      const b = i(r.buffer, p[d + h], m[d + h], r.position - (p[d] - p[d + h]), g);
      v += t.repeat(" ", c.indent) + n((r.line + h + 1).toString(), y) + " | " + b.str + `
`;
    }
    return v.replace(/\n$/, "");
  }
  e.exports = s;
})), Pe = /* @__PURE__ */ Se(((a, e) => {
  var t = Et(), i = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ], n = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function s(c) {
    const l = {};
    return c !== null && Object.keys(c).forEach(function(p) {
      c[p].forEach(function(m) {
        l[String(m)] = p;
      });
    }), l;
  }
  function r(c, l) {
    if (l = l || {}, Object.keys(l).forEach(function(p) {
      if (i.indexOf(p) === -1) throw new t('Unknown option "' + p + '" is met in definition of "' + c + '" YAML type.');
    }), this.options = l, this.tag = c, this.kind = l.kind || null, this.resolve = l.resolve || function() {
      return !0;
    }, this.construct = l.construct || function(p) {
      return p;
    }, this.instanceOf = l.instanceOf || null, this.predicate = l.predicate || null, this.represent = l.represent || null, this.representName = l.representName || null, this.defaultStyle = l.defaultStyle || null, this.multi = l.multi || !1, this.styleAliases = s(l.styleAliases || null), n.indexOf(this.kind) === -1) throw new t('Unknown kind "' + this.kind + '" is specified for "' + c + '" YAML type.');
  }
  e.exports = r;
})), to = /* @__PURE__ */ Se(((a, e) => {
  var t = Et(), i = Pe();
  function n(c, l) {
    const p = [];
    return c[l].forEach(function(m) {
      let u = p.length;
      p.forEach(function(d, v) {
        d.tag === m.tag && d.kind === m.kind && d.multi === m.multi && (u = v);
      }), p[u] = m;
    }), p;
  }
  function s() {
    const c = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function l(p) {
      p.multi ? (c.multi[p.kind].push(p), c.multi.fallback.push(p)) : c[p.kind][p.tag] = c.fallback[p.tag] = p;
    }
    for (let p = 0, m = arguments.length; p < m; p += 1) arguments[p].forEach(l);
    return c;
  }
  function r(c) {
    return this.extend(c);
  }
  r.prototype.extend = function(l) {
    let p = [], m = [];
    if (l instanceof i) m.push(l);
    else if (Array.isArray(l)) m = m.concat(l);
    else if (l && (Array.isArray(l.implicit) || Array.isArray(l.explicit)))
      l.implicit && (p = p.concat(l.implicit)), l.explicit && (m = m.concat(l.explicit));
    else throw new t("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    p.forEach(function(d) {
      if (!(d instanceof i)) throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      if (d.loadKind && d.loadKind !== "scalar") throw new t("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      if (d.multi) throw new t("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
    }), m.forEach(function(d) {
      if (!(d instanceof i)) throw new t("Specified list of YAML types (or a single Type object) contains a non-Type object.");
    });
    const u = Object.create(r.prototype);
    return u.implicit = (this.implicit || []).concat(p), u.explicit = (this.explicit || []).concat(m), u.compiledImplicit = n(u, "implicit"), u.compiledExplicit = n(u, "explicit"), u.compiledTypeMap = s(u.compiledImplicit, u.compiledExplicit), u;
  }, e.exports = r;
})), no = /* @__PURE__ */ Se(((a, e) => {
  e.exports = new (Pe())("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(t) {
      return t !== null ? t : "";
    }
  });
})), io = /* @__PURE__ */ Se(((a, e) => {
  e.exports = new (Pe())("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(t) {
      return t !== null ? t : [];
    }
  });
})), ao = /* @__PURE__ */ Se(((a, e) => {
  e.exports = new (Pe())("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(t) {
      return t !== null ? t : {};
    }
  });
})), ro = /* @__PURE__ */ Se(((a, e) => {
  e.exports = new (to())({ explicit: [
    no(),
    io(),
    ao()
  ] });
})), so = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe();
  function i(r) {
    if (r === null) return !0;
    const c = r.length;
    return c === 1 && r === "~" || c === 4 && (r === "null" || r === "Null" || r === "NULL");
  }
  function n() {
    return null;
  }
  function s(r) {
    return r === null;
  }
  e.exports = new t("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: i,
    construct: n,
    predicate: s,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
})), oo = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe();
  function i(r) {
    if (r === null) return !1;
    const c = r.length;
    return c === 4 && (r === "true" || r === "True" || r === "TRUE") || c === 5 && (r === "false" || r === "False" || r === "FALSE");
  }
  function n(r) {
    return r === "true" || r === "True" || r === "TRUE";
  }
  function s(r) {
    return Object.prototype.toString.call(r) === "[object Boolean]";
  }
  e.exports = new t("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: i,
    construct: n,
    predicate: s,
    represent: {
      lowercase: function(r) {
        return r ? "true" : "false";
      },
      uppercase: function(r) {
        return r ? "TRUE" : "FALSE";
      },
      camelcase: function(r) {
        return r ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
})), co = /* @__PURE__ */ Se(((a, e) => {
  var t = wt(), i = Pe();
  function n(u) {
    return u >= 48 && u <= 57 || u >= 65 && u <= 70 || u >= 97 && u <= 102;
  }
  function s(u) {
    return u >= 48 && u <= 55;
  }
  function r(u) {
    return u >= 48 && u <= 57;
  }
  function c(u) {
    if (u === null) return !1;
    const d = u.length;
    let v = 0, y = !1;
    if (!d) return !1;
    let g = u[v];
    if ((g === "-" || g === "+") && (g = u[++v]), g === "0") {
      if (v + 1 === d) return !0;
      if (g = u[++v], g === "b") {
        for (v++; v < d; v++) {
          if (g = u[v], g !== "0" && g !== "1") return !1;
          y = !0;
        }
        return y && Number.isFinite(l(u));
      }
      if (g === "x") {
        for (v++; v < d; v++) {
          if (!n(u.charCodeAt(v))) return !1;
          y = !0;
        }
        return y && Number.isFinite(l(u));
      }
      if (g === "o") {
        for (v++; v < d; v++) {
          if (!s(u.charCodeAt(v))) return !1;
          y = !0;
        }
        return y && Number.isFinite(l(u));
      }
    }
    for (; v < d; v++) {
      if (!r(u.charCodeAt(v))) return !1;
      y = !0;
    }
    return y ? Number.isFinite(l(u)) : !1;
  }
  function l(u) {
    let d = u, v = 1, y = d[0];
    if ((y === "-" || y === "+") && (y === "-" && (v = -1), d = d.slice(1), y = d[0]), d === "0") return 0;
    if (y === "0") {
      if (d[1] === "b") return v * parseInt(d.slice(2), 2);
      if (d[1] === "x") return v * parseInt(d.slice(2), 16);
      if (d[1] === "o") return v * parseInt(d.slice(2), 8);
    }
    return v * parseInt(d, 10);
  }
  function p(u) {
    return l(u);
  }
  function m(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && u % 1 === 0 && !t.isNegativeZero(u);
  }
  e.exports = new i("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: c,
    construct: p,
    predicate: m,
    represent: {
      binary: function(u) {
        return u >= 0 ? "0b" + u.toString(2) : "-0b" + u.toString(2).slice(1);
      },
      octal: function(u) {
        return u >= 0 ? "0o" + u.toString(8) : "-0o" + u.toString(8).slice(1);
      },
      decimal: function(u) {
        return u.toString(10);
      },
      hexadecimal: function(u) {
        return u >= 0 ? "0x" + u.toString(16).toUpperCase() : "-0x" + u.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
})), lo = /* @__PURE__ */ Se(((a, e) => {
  var t = wt(), i = Pe(), n = /* @__PURE__ */ new RegExp("^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"), s = /* @__PURE__ */ new RegExp("^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$");
  function r(u) {
    return u === null || !n.test(u) ? !1 : Number.isFinite(parseFloat(u, 10)) ? !0 : s.test(u);
  }
  function c(u) {
    let d = u.toLowerCase();
    const v = d[0] === "-" ? -1 : 1;
    return "+-".indexOf(d[0]) >= 0 && (d = d.slice(1)), d === ".inf" ? v === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY : d === ".nan" ? NaN : v * parseFloat(d, 10);
  }
  var l = /^[-+]?[0-9]+e/;
  function p(u, d) {
    if (isNaN(u)) switch (d) {
      case "lowercase":
        return ".nan";
      case "uppercase":
        return ".NAN";
      case "camelcase":
        return ".NaN";
    }
    else if (Number.POSITIVE_INFINITY === u) switch (d) {
      case "lowercase":
        return ".inf";
      case "uppercase":
        return ".INF";
      case "camelcase":
        return ".Inf";
    }
    else if (Number.NEGATIVE_INFINITY === u) switch (d) {
      case "lowercase":
        return "-.inf";
      case "uppercase":
        return "-.INF";
      case "camelcase":
        return "-.Inf";
    }
    else if (t.isNegativeZero(u)) return "-0.0";
    const v = u.toString(10);
    return l.test(v) ? v.replace("e", ".e") : v;
  }
  function m(u) {
    return Object.prototype.toString.call(u) === "[object Number]" && (u % 1 !== 0 || t.isNegativeZero(u));
  }
  e.exports = new i("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: r,
    construct: c,
    predicate: m,
    represent: p,
    defaultStyle: "lowercase"
  });
})), uo = /* @__PURE__ */ Se(((a, e) => {
  e.exports = ro().extend({ implicit: [
    so(),
    oo(),
    co(),
    lo()
  ] });
})), po = /* @__PURE__ */ Se(((a, e) => {
  e.exports = uo();
})), mo = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe(), i = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"), n = /* @__PURE__ */ new RegExp("^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$");
  function s(l) {
    return l === null ? !1 : i.exec(l) !== null || n.exec(l) !== null;
  }
  function r(l) {
    let p = 0, m = null, u = i.exec(l);
    if (u === null && (u = n.exec(l)), u === null) throw new Error("Date resolve error");
    const d = +u[1], v = +u[2] - 1, y = +u[3];
    if (!u[4]) return new Date(Date.UTC(d, v, y));
    const g = +u[4], f = +u[5], h = +u[6];
    if (u[7]) {
      for (p = u[7].slice(0, 3); p.length < 3; ) p += "0";
      p = +p;
    }
    if (u[9]) {
      const S = +u[10], E = +(u[11] || 0);
      m = (S * 60 + E) * 6e4, u[9] === "-" && (m = -m);
    }
    const b = new Date(Date.UTC(d, v, y, g, f, h, p));
    return m && b.setTime(b.getTime() - m), b;
  }
  function c(l) {
    return l.toISOString();
  }
  e.exports = new t("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: s,
    construct: r,
    instanceOf: Date,
    represent: c
  });
})), fo = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe();
  function i(n) {
    return n === "<<" || n === null;
  }
  e.exports = new t("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: i
  });
})), ho = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe(), i = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=
\r`;
  function n(l) {
    if (l === null) return !1;
    let p = 0;
    const m = l.length, u = i;
    for (let d = 0; d < m; d++) {
      const v = u.indexOf(l.charAt(d));
      if (!(v > 64)) {
        if (v < 0) return !1;
        p += 6;
      }
    }
    return p % 8 === 0;
  }
  function s(l) {
    const p = l.replace(/[\r\n=]/g, ""), m = p.length, u = i;
    let d = 0;
    const v = [];
    for (let g = 0; g < m; g++)
      g % 4 === 0 && g && (v.push(d >> 16 & 255), v.push(d >> 8 & 255), v.push(d & 255)), d = d << 6 | u.indexOf(p.charAt(g));
    const y = m % 4 * 6;
    return y === 0 ? (v.push(d >> 16 & 255), v.push(d >> 8 & 255), v.push(d & 255)) : y === 18 ? (v.push(d >> 10 & 255), v.push(d >> 2 & 255)) : y === 12 && v.push(d >> 4 & 255), new Uint8Array(v);
  }
  function r(l) {
    let p = "", m = 0;
    const u = l.length, d = i;
    for (let y = 0; y < u; y++)
      y % 3 === 0 && y && (p += d[m >> 18 & 63], p += d[m >> 12 & 63], p += d[m >> 6 & 63], p += d[m & 63]), m = (m << 8) + l[y];
    const v = u % 3;
    return v === 0 ? (p += d[m >> 18 & 63], p += d[m >> 12 & 63], p += d[m >> 6 & 63], p += d[m & 63]) : v === 2 ? (p += d[m >> 10 & 63], p += d[m >> 4 & 63], p += d[m << 2 & 63], p += d[64]) : v === 1 && (p += d[m >> 2 & 63], p += d[m << 4 & 63], p += d[64], p += d[64]), p;
  }
  function c(l) {
    return Object.prototype.toString.call(l) === "[object Uint8Array]";
  }
  e.exports = new t("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: n,
    construct: s,
    predicate: c,
    represent: r
  });
})), vo = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe(), i = Object.prototype.hasOwnProperty, n = Object.prototype.toString;
  function s(c) {
    if (c === null) return !0;
    const l = [], p = c;
    for (let m = 0, u = p.length; m < u; m += 1) {
      const d = p[m];
      let v = !1;
      if (n.call(d) !== "[object Object]") return !1;
      let y;
      for (y in d) if (i.call(d, y)) if (!v) v = !0;
      else return !1;
      if (!v) return !1;
      if (l.indexOf(y) === -1) l.push(y);
      else return !1;
    }
    return !0;
  }
  function r(c) {
    return c !== null ? c : [];
  }
  e.exports = new t("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: s,
    construct: r
  });
})), xo = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe(), i = Object.prototype.toString;
  function n(r) {
    if (r === null) return !0;
    const c = r, l = new Array(c.length);
    for (let p = 0, m = c.length; p < m; p += 1) {
      const u = c[p];
      if (i.call(u) !== "[object Object]") return !1;
      const d = Object.keys(u);
      if (d.length !== 1) return !1;
      l[p] = [d[0], u[d[0]]];
    }
    return !0;
  }
  function s(r) {
    if (r === null) return [];
    const c = r, l = new Array(c.length);
    for (let p = 0, m = c.length; p < m; p += 1) {
      const u = c[p], d = Object.keys(u);
      l[p] = [d[0], u[d[0]]];
    }
    return l;
  }
  e.exports = new t("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: n,
    construct: s
  });
})), go = /* @__PURE__ */ Se(((a, e) => {
  var t = Pe(), i = Object.prototype.hasOwnProperty;
  function n(r) {
    if (r === null) return !0;
    const c = r;
    for (const l in c) if (i.call(c, l) && c[l] !== null)
      return !1;
    return !0;
  }
  function s(r) {
    return r !== null ? r : {};
  }
  e.exports = new t("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: n,
    construct: s
  });
})), pa = /* @__PURE__ */ Se(((a, e) => {
  e.exports = po().extend({
    implicit: [mo(), fo()],
    explicit: [
      ho(),
      vo(),
      xo(),
      go()
    ]
  });
})), el = /* @__PURE__ */ Se(((a, e) => {
  var t = wt(), i = Et(), n = Zc(), s = pa(), r = Object.prototype.hasOwnProperty, c = 1, l = 2, p = 3, m = 4, u = 1, d = 2, v = 3, y = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, g = /[\x85\u2028\u2029]/, f = /[,\[\]{}]/, h = /^(?:!|!!|![0-9A-Za-z-]+!)$/, b = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function S(o) {
    return Object.prototype.toString.call(o);
  }
  function E(o) {
    return o === 10 || o === 13;
  }
  function w(o) {
    return o === 9 || o === 32;
  }
  function A(o) {
    return o === 9 || o === 32 || o === 10 || o === 13;
  }
  function O(o) {
    return o === 44 || o === 91 || o === 93 || o === 123 || o === 125;
  }
  function W(o) {
    if (o >= 48 && o <= 57) return o - 48;
    const R = o | 32;
    return R >= 97 && R <= 102 ? R - 97 + 10 : -1;
  }
  function X(o) {
    return o === 120 ? 2 : o === 117 ? 4 : o === 85 ? 8 : 0;
  }
  function V(o) {
    return o >= 48 && o <= 57 ? o - 48 : -1;
  }
  function pe(o) {
    switch (o) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return `
`;
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "";
      case 95:
        return " ";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function me(o) {
    return o <= 65535 ? String.fromCharCode(o) : String.fromCharCode((o - 65536 >> 10) + 55296, (o - 65536 & 1023) + 56320);
  }
  function ke(o, R, I) {
    R === "__proto__" ? Object.defineProperty(o, R, {
      configurable: !0,
      enumerable: !0,
      writable: !0,
      value: I
    }) : o[R] = I;
  }
  var le = new Array(256), fe = new Array(256);
  for (let o = 0; o < 256; o++)
    le[o] = pe(o) ? 1 : 0, fe[o] = pe(o);
  function he(o, R) {
    this.input = o, this.filename = R.filename || null, this.schema = R.schema || s, this.onWarning = R.onWarning || null, this.legacy = R.legacy || !1, this.json = R.json || !1, this.listener = R.listener || null, this.maxDepth = typeof R.maxDepth == "number" ? R.maxDepth : 100, this.maxMergeSeqLength = typeof R.maxMergeSeqLength == "number" ? R.maxMergeSeqLength : 20, this.implicitTypes = this.schema.compiledImplicit, this.typeMap = this.schema.compiledTypeMap, this.length = o.length, this.position = 0, this.line = 0, this.lineStart = 0, this.lineIndent = 0, this.depth = 0, this.firstTabInLine = -1, this.documents = [], this.anchorMapTransactions = [];
  }
  function we(o, R) {
    const I = {
      name: o.filename,
      buffer: o.input.slice(0, -1),
      position: o.position,
      line: o.line,
      column: o.position - o.lineStart
    };
    return I.snippet = n(I), new i(R, I);
  }
  function J(o, R) {
    throw we(o, R);
  }
  function k(o, R) {
    o.onWarning && o.onWarning.call(null, we(o, R));
  }
  function M(o, R, I) {
    const N = o.anchorMapTransactions;
    if (N.length !== 0) {
      const D = N[N.length - 1];
      r.call(D, R) || (D[R] = {
        existed: r.call(o.anchorMap, R),
        value: o.anchorMap[R]
      });
    }
    o.anchorMap[R] = I;
  }
  function z(o) {
    o.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function Z(o) {
    const R = o.anchorMapTransactions.pop(), I = o.anchorMapTransactions;
    if (I.length === 0) return;
    const N = I[I.length - 1], D = Object.keys(R);
    for (let K = 0, x = D.length; K < x; K += 1) {
      const T = D[K];
      r.call(N, T) || (N[T] = R[T]);
    }
  }
  function re(o) {
    const R = o.anchorMapTransactions.pop(), I = Object.keys(R);
    for (let N = I.length - 1; N >= 0; N -= 1) {
      const D = R[I[N]];
      D.existed ? o.anchorMap[I[N]] = D.value : delete o.anchorMap[I[N]];
    }
  }
  function de(o) {
    return {
      position: o.position,
      line: o.line,
      lineStart: o.lineStart,
      lineIndent: o.lineIndent,
      firstTabInLine: o.firstTabInLine,
      tag: o.tag,
      anchor: o.anchor,
      kind: o.kind,
      result: o.result
    };
  }
  function Y(o, R) {
    o.position = R.position, o.line = R.line, o.lineStart = R.lineStart, o.lineIndent = R.lineIndent, o.firstTabInLine = R.firstTabInLine, o.tag = R.tag, o.anchor = R.anchor, o.kind = R.kind, o.result = R.result;
  }
  var se = {
    YAML: function(R, I, N) {
      R.version !== null && J(R, "duplication of %YAML directive"), N.length !== 1 && J(R, "YAML directive accepts exactly one argument");
      const D = /^([0-9]+)\.([0-9]+)$/.exec(N[0]);
      D === null && J(R, "ill-formed argument of the YAML directive");
      const K = parseInt(D[1], 10), x = parseInt(D[2], 10);
      K !== 1 && J(R, "unacceptable YAML version of the document"), R.version = N[0], R.checkLineBreaks = x < 2, x !== 1 && x !== 2 && k(R, "unsupported YAML version of the document");
    },
    TAG: function(R, I, N) {
      let D;
      N.length !== 2 && J(R, "TAG directive accepts exactly two arguments");
      const K = N[0];
      D = N[1], h.test(K) || J(R, "ill-formed tag handle (first argument) of the TAG directive"), r.call(R.tagMap, K) && J(R, 'there is a previously declared suffix for "' + K + '" tag handle'), b.test(D) || J(R, "ill-formed tag prefix (second argument) of the TAG directive");
      try {
        D = decodeURIComponent(D);
      } catch {
        J(R, "tag prefix is malformed: " + D);
      }
      R.tagMap[K] = D;
    }
  };
  function P(o, R, I, N) {
    if (R < I) {
      const D = o.input.slice(R, I);
      if (N) for (let K = 0, x = D.length; K < x; K += 1) {
        const T = D.charCodeAt(K);
        T === 9 || T >= 32 && T <= 1114111 || J(o, "expected valid JSON character");
      }
      else y.test(D) && J(o, "the stream contains non-printable characters");
      o.result += D;
    }
  }
  function C(o, R, I, N) {
    t.isObject(I) || J(o, "cannot merge mappings; the provided source object is unacceptable");
    const D = Object.keys(I);
    for (let K = 0, x = D.length; K < x; K += 1) {
      const T = D[K];
      r.call(R, T) || (ke(R, T, I[T]), N[T] = !0);
    }
  }
  function $(o, R, I, N, D, K, x, T, H) {
    if (Array.isArray(D)) {
      D = Array.prototype.slice.call(D);
      for (let F = 0, L = D.length; F < L; F += 1)
        Array.isArray(D[F]) && J(o, "nested arrays are not supported inside keys"), typeof D == "object" && S(D[F]) === "[object Object]" && (D[F] = "[object Object]");
    }
    if (typeof D == "object" && S(D) === "[object Object]" && (D = "[object Object]"), D = String(D), R === null && (R = {}), N === "tag:yaml.org,2002:merge") if (Array.isArray(K)) {
      K.length > o.maxMergeSeqLength && J(o, "merge sequence length exceeded maxMergeSeqLength (" + o.maxMergeSeqLength + ")");
      const F = /* @__PURE__ */ new Set();
      for (let L = 0, B = K.length; L < B; L += 1) {
        const j = K[L];
        F.has(j) || (F.add(j), C(o, R, j, I));
      }
    } else C(o, R, K, I);
    else
      !o.json && !r.call(I, D) && r.call(R, D) && (o.line = x || o.line, o.lineStart = T || o.lineStart, o.position = H || o.position, J(o, "duplicated mapping key")), ke(R, D, K), delete I[D];
    return R;
  }
  function G(o) {
    const R = o.input.charCodeAt(o.position);
    R === 10 ? o.position++ : R === 13 ? (o.position++, o.input.charCodeAt(o.position) === 10 && o.position++) : J(o, "a line break is expected"), o.line += 1, o.lineStart = o.position, o.firstTabInLine = -1;
  }
  function q(o, R, I) {
    let N = 0, D = o.input.charCodeAt(o.position);
    for (; D !== 0; ) {
      for (; w(D); )
        D === 9 && o.firstTabInLine === -1 && (o.firstTabInLine = o.position), D = o.input.charCodeAt(++o.position);
      if (R && D === 35) do
        D = o.input.charCodeAt(++o.position);
      while (D !== 10 && D !== 13 && D !== 0);
      if (E(D))
        for (G(o), D = o.input.charCodeAt(o.position), N++, o.lineIndent = 0; D === 32; )
          o.lineIndent++, D = o.input.charCodeAt(++o.position);
      else break;
    }
    return I !== -1 && N !== 0 && o.lineIndent < I && k(o, "deficient indentation"), N;
  }
  function ee(o) {
    let R = o.position, I = o.input.charCodeAt(R);
    return !!((I === 45 || I === 46) && I === o.input.charCodeAt(R + 1) && I === o.input.charCodeAt(R + 2) && (R += 3, I = o.input.charCodeAt(R), I === 0 || A(I)));
  }
  function ne(o, R) {
    R === 1 ? o.result += " " : R > 1 && (o.result += t.repeat(`
`, R - 1));
  }
  function ie(o, R, I) {
    let N, D, K, x, T, H;
    const F = o.kind, L = o.result;
    let B = o.input.charCodeAt(o.position);
    if (A(B) || O(B) || B === 35 || B === 38 || B === 42 || B === 33 || B === 124 || B === 62 || B === 39 || B === 34 || B === 37 || B === 64 || B === 96) return !1;
    if (B === 63 || B === 45) {
      const j = o.input.charCodeAt(o.position + 1);
      if (A(j) || I && O(j)) return !1;
    }
    for (o.kind = "scalar", o.result = "", N = D = o.position, K = !1; B !== 0; ) {
      if (B === 58) {
        const j = o.input.charCodeAt(o.position + 1);
        if (A(j) || I && O(j)) break;
      } else if (B === 35) {
        if (A(o.input.charCodeAt(o.position - 1))) break;
      } else {
        if (o.position === o.lineStart && ee(o) || I && O(B)) break;
        if (E(B))
          if (x = o.line, T = o.lineStart, H = o.lineIndent, q(o, !1, -1), o.lineIndent >= R) {
            K = !0, B = o.input.charCodeAt(o.position);
            continue;
          } else {
            o.position = D, o.line = x, o.lineStart = T, o.lineIndent = H;
            break;
          }
      }
      K && (P(o, N, D, !1), ne(o, o.line - x), N = D = o.position, K = !1), w(B) || (D = o.position + 1), B = o.input.charCodeAt(++o.position);
    }
    return P(o, N, D, !1), o.result ? !0 : (o.kind = F, o.result = L, !1);
  }
  function ce(o, R) {
    let I, N, D = o.input.charCodeAt(o.position);
    if (D !== 39) return !1;
    for (o.kind = "scalar", o.result = "", o.position++, I = N = o.position; (D = o.input.charCodeAt(o.position)) !== 0; ) if (D === 39)
      if (P(o, I, o.position, !0), D = o.input.charCodeAt(++o.position), D === 39)
        I = o.position, o.position++, N = o.position;
      else return !0;
    else E(D) ? (P(o, I, N, !0), ne(o, q(o, !1, R)), I = N = o.position) : o.position === o.lineStart && ee(o) ? J(o, "unexpected end of the document within a single quoted scalar") : (o.position++, w(D) || (N = o.position));
    J(o, "unexpected end of the stream within a single quoted scalar");
  }
  function _e(o, R) {
    let I, N, D, K = o.input.charCodeAt(o.position);
    if (K !== 34) return !1;
    for (o.kind = "scalar", o.result = "", o.position++, I = N = o.position; (K = o.input.charCodeAt(o.position)) !== 0; ) {
      if (K === 34)
        return P(o, I, o.position, !0), o.position++, !0;
      if (K === 92) {
        if (P(o, I, o.position, !0), K = o.input.charCodeAt(++o.position), E(K)) q(o, !1, R);
        else if (K < 256 && le[K])
          o.result += fe[K], o.position++;
        else if ((D = X(K)) > 0) {
          let x = D, T = 0;
          for (; x > 0; x--)
            K = o.input.charCodeAt(++o.position), (D = W(K)) >= 0 ? T = (T << 4) + D : J(o, "expected hexadecimal character");
          o.result += me(T), o.position++;
        } else J(o, "unknown escape sequence");
        I = N = o.position;
      } else E(K) ? (P(o, I, N, !0), ne(o, q(o, !1, R)), I = N = o.position) : o.position === o.lineStart && ee(o) ? J(o, "unexpected end of the document within a double quoted scalar") : (o.position++, w(K) || (N = o.position));
    }
    J(o, "unexpected end of the stream within a double quoted scalar");
  }
  function be(o, R) {
    let I = !0, N, D, K;
    const x = o.tag;
    let T;
    const H = o.anchor;
    let F, L, B, j;
    const te = /* @__PURE__ */ Object.create(null);
    let Q, ae, oe, ve = o.input.charCodeAt(o.position);
    if (ve === 91)
      F = 93, j = !1, T = [];
    else if (ve === 123)
      F = 125, j = !0, T = {};
    else return !1;
    for (o.anchor !== null && M(o, o.anchor, T), ve = o.input.charCodeAt(++o.position); ve !== 0; ) {
      if (q(o, !0, R), ve = o.input.charCodeAt(o.position), ve === F)
        return o.position++, o.tag = x, o.anchor = H, o.kind = j ? "mapping" : "sequence", o.result = T, !0;
      I ? ve === 44 && J(o, "expected the node content, but found ','") : J(o, "missed comma between flow collection entries"), ae = Q = oe = null, L = B = !1, ve === 63 && A(o.input.charCodeAt(o.position + 1)) && (L = B = !0, o.position++, q(o, !0, R)), N = o.line, D = o.lineStart, K = o.position, Ye(o, R, c, !1, !0), ae = o.tag, Q = o.result, q(o, !0, R), ve = o.input.charCodeAt(o.position), (B || o.line === N) && ve === 58 && (L = !0, ve = o.input.charCodeAt(++o.position), q(o, !0, R), Ye(o, R, c, !1, !0), oe = o.result), j ? $(o, T, te, ae, Q, oe, N, D, K) : L ? T.push($(o, null, te, ae, Q, oe, N, D, K)) : T.push(Q), q(o, !0, R), ve = o.input.charCodeAt(o.position), ve === 44 ? (I = !0, ve = o.input.charCodeAt(++o.position)) : I = !1;
    }
    J(o, "unexpected end of the stream within a flow collection");
  }
  function qe(o, R) {
    let I, N = u, D = !1, K = !1, x = R, T = 0, H = !1, F, L = o.input.charCodeAt(o.position);
    if (L === 124) I = !1;
    else if (L === 62) I = !0;
    else return !1;
    for (o.kind = "scalar", o.result = ""; L !== 0; )
      if (L = o.input.charCodeAt(++o.position), L === 43 || L === 45) u === N ? N = L === 43 ? v : d : J(o, "repeat of a chomping mode identifier");
      else if ((F = V(L)) >= 0) F === 0 ? J(o, "bad explicit indentation width of a block scalar; it cannot be less than one") : K ? J(o, "repeat of an indentation width identifier") : (x = R + F - 1, K = !0);
      else break;
    if (w(L)) {
      do
        L = o.input.charCodeAt(++o.position);
      while (w(L));
      if (L === 35) do
        L = o.input.charCodeAt(++o.position);
      while (!E(L) && L !== 0);
    }
    for (; L !== 0; ) {
      for (G(o), o.lineIndent = 0, L = o.input.charCodeAt(o.position); (!K || o.lineIndent < x) && L === 32; )
        o.lineIndent++, L = o.input.charCodeAt(++o.position);
      if (!K && o.lineIndent > x && (x = o.lineIndent), E(L)) {
        T++;
        continue;
      }
      if (!K && x === 0 && J(o, "missing indentation for block scalar"), o.lineIndent < x) {
        N === v ? o.result += t.repeat(`
`, D ? 1 + T : T) : N === u && D && (o.result += `
`);
        break;
      }
      I ? w(L) ? (H = !0, o.result += t.repeat(`
`, D ? 1 + T : T)) : H ? (H = !1, o.result += t.repeat(`
`, T + 1)) : T === 0 ? D && (o.result += " ") : o.result += t.repeat(`
`, T) : o.result += t.repeat(`
`, D ? 1 + T : T), D = !0, K = !0, T = 0;
      const B = o.position;
      for (; !E(L) && L !== 0; ) L = o.input.charCodeAt(++o.position);
      P(o, B, o.position, !1);
    }
    return !0;
  }
  function Fe(o, R) {
    const I = o.tag, N = o.anchor, D = [];
    let K = !1;
    if (o.firstTabInLine !== -1) return !1;
    o.anchor !== null && M(o, o.anchor, D);
    let x = o.input.charCodeAt(o.position);
    for (; x !== 0 && (o.firstTabInLine !== -1 && (o.position = o.firstTabInLine, J(o, "tab characters must not be used in indentation")), !(x !== 45 || !A(o.input.charCodeAt(o.position + 1)))); ) {
      if (K = !0, o.position++, q(o, !0, -1) && o.lineIndent <= R) {
        D.push(null), x = o.input.charCodeAt(o.position);
        continue;
      }
      const T = o.line;
      if (Ye(o, R, p, !1, !0), D.push(o.result), q(o, !0, -1), x = o.input.charCodeAt(o.position), (o.line === T || o.lineIndent > R) && x !== 0) J(o, "bad indentation of a sequence entry");
      else if (o.lineIndent < R) break;
    }
    return K ? (o.tag = I, o.anchor = N, o.kind = "sequence", o.result = D, !0) : !1;
  }
  function He(o, R, I) {
    let N, D, K, x;
    const T = o.tag, H = o.anchor, F = {}, L = /* @__PURE__ */ Object.create(null);
    let B = null, j = null, te = null, Q = !1, ae = !1;
    if (o.firstTabInLine !== -1) return !1;
    o.anchor !== null && M(o, o.anchor, F);
    let oe = o.input.charCodeAt(o.position);
    for (; oe !== 0; ) {
      !Q && o.firstTabInLine !== -1 && (o.position = o.firstTabInLine, J(o, "tab characters must not be used in indentation"));
      const ve = o.input.charCodeAt(o.position + 1), Re = o.line;
      if ((oe === 63 || oe === 58) && A(ve))
        oe === 63 ? (Q && ($(o, F, L, B, j, null, D, K, x), B = j = te = null), ae = !0, Q = !0, N = !0) : Q ? (Q = !1, N = !0) : J(o, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line"), o.position += 1, oe = ve;
      else {
        if (D = o.line, K = o.lineStart, x = o.position, !Ye(o, I, l, !1, !0)) break;
        if (o.line === Re) {
          for (oe = o.input.charCodeAt(o.position); w(oe); ) oe = o.input.charCodeAt(++o.position);
          if (oe === 58)
            oe = o.input.charCodeAt(++o.position), A(oe) || J(o, "a whitespace character is expected after the key-value separator within a block mapping"), Q && ($(o, F, L, B, j, null, D, K, x), B = j = te = null), ae = !0, Q = !1, N = !1, B = o.tag, j = o.result;
          else if (ae) J(o, "can not read an implicit mapping pair; a colon is missed");
          else
            return o.tag = T, o.anchor = H, !0;
        } else if (ae) J(o, "can not read a block mapping entry; a multiline key may not be an implicit key");
        else
          return o.tag = T, o.anchor = H, !0;
      }
      if ((o.line === Re || o.lineIndent > R) && (Q && (D = o.line, K = o.lineStart, x = o.position), Ye(o, R, m, !0, N) && (Q ? j = o.result : te = o.result), Q || ($(o, F, L, B, j, te, D, K, x), B = j = te = null), q(o, !0, -1), oe = o.input.charCodeAt(o.position)), (o.line === Re || o.lineIndent > R) && oe !== 0) J(o, "bad indentation of a mapping entry");
      else if (o.lineIndent < R) break;
    }
    return Q && $(o, F, L, B, j, null, D, K, x), ae && (o.tag = T, o.anchor = H, o.kind = "mapping", o.result = F), ae;
  }
  function Me(o) {
    let R = !1, I = !1, N, D, K = o.input.charCodeAt(o.position);
    if (K !== 33) return !1;
    o.tag !== null && J(o, "duplication of a tag property"), K = o.input.charCodeAt(++o.position), K === 60 ? (R = !0, K = o.input.charCodeAt(++o.position)) : K === 33 ? (I = !0, N = "!!", K = o.input.charCodeAt(++o.position)) : N = "!";
    let x = o.position;
    if (R) {
      do
        K = o.input.charCodeAt(++o.position);
      while (K !== 0 && K !== 62);
      o.position < o.length ? (D = o.input.slice(x, o.position), K = o.input.charCodeAt(++o.position)) : J(o, "unexpected end of the stream within a verbatim tag");
    } else {
      for (; K !== 0 && !A(K); )
        K === 33 && (I ? J(o, "tag suffix cannot contain exclamation marks") : (N = o.input.slice(x - 1, o.position + 1), h.test(N) || J(o, "named tag handle cannot contain such characters"), I = !0, x = o.position + 1)), K = o.input.charCodeAt(++o.position);
      D = o.input.slice(x, o.position), f.test(D) && J(o, "tag suffix cannot contain flow indicator characters");
    }
    D && !b.test(D) && J(o, "tag name cannot contain such characters: " + D);
    try {
      D = decodeURIComponent(D);
    } catch {
      J(o, "tag name is malformed: " + D);
    }
    return R ? o.tag = D : r.call(o.tagMap, N) ? o.tag = o.tagMap[N] + D : N === "!" ? o.tag = "!" + D : N === "!!" ? o.tag = "tag:yaml.org,2002:" + D : J(o, 'undeclared tag handle "' + N + '"'), !0;
  }
  function Ke(o) {
    let R = o.input.charCodeAt(o.position);
    if (R !== 38) return !1;
    o.anchor !== null && J(o, "duplication of an anchor property"), R = o.input.charCodeAt(++o.position);
    const I = o.position;
    for (; R !== 0 && !A(R) && !O(R); ) R = o.input.charCodeAt(++o.position);
    return o.position === I && J(o, "name of an anchor node must contain at least one character"), o.anchor = o.input.slice(I, o.position), !0;
  }
  function ze(o) {
    let R = o.input.charCodeAt(o.position);
    if (R !== 42) return !1;
    R = o.input.charCodeAt(++o.position);
    const I = o.position;
    for (; R !== 0 && !A(R) && !O(R); ) R = o.input.charCodeAt(++o.position);
    o.position === I && J(o, "name of an alias node must contain at least one character");
    const N = o.input.slice(I, o.position);
    return r.call(o.anchorMap, N) || J(o, 'unidentified alias "' + N + '"'), o.result = o.anchorMap[N], q(o, !0, -1), !0;
  }
  function Ge(o, R, I, N) {
    const D = de(o);
    return z(o), Y(o, R), o.tag = null, o.anchor = null, o.kind = null, o.result = null, He(o, I, N) && o.kind === "mapping" ? (Z(o), !0) : (re(o), Y(o, D), !1);
  }
  function Ye(o, R, I, N, D) {
    let K, x, T = 1, H = !1, F = !1, L = null, B, j, te;
    o.depth >= o.maxDepth && J(o, "nesting exceeded maxDepth (" + o.maxDepth + ")"), o.depth += 1, o.listener !== null && o.listener("open", o), o.tag = null, o.anchor = null, o.kind = null, o.result = null;
    const Q = K = x = m === I || p === I;
    if (N && q(o, !0, -1) && (H = !0, o.lineIndent > R ? T = 1 : o.lineIndent === R ? T = 0 : o.lineIndent < R && (T = -1)), T === 1) for (; ; ) {
      const ae = o.input.charCodeAt(o.position), oe = de(o);
      if (H && (ae === 33 && o.tag !== null || ae === 38 && o.anchor !== null) || !Me(o) && !Ke(o)) break;
      L === null && (L = oe), q(o, !0, -1) ? (H = !0, x = Q, o.lineIndent > R ? T = 1 : o.lineIndent === R ? T = 0 : o.lineIndent < R && (T = -1)) : x = !1;
    }
    if (x && (x = H || D), T === 1 || m === I)
      if (c === I || l === I ? j = R : j = R + 1, te = o.position - o.lineStart, T === 1) if (x && (Fe(o, te) || He(o, te, j)) || be(o, j)) F = !0;
      else {
        const ae = o.input.charCodeAt(o.position);
        L !== null && Q && !x && ae !== 124 && ae !== 62 && Ge(o, L, L.position - L.lineStart, j) || K && qe(o, j) || ce(o, j) || _e(o, j) ? F = !0 : ze(o) ? (F = !0, (o.tag !== null || o.anchor !== null) && J(o, "alias node should not have any properties")) : ie(o, j, c === I) && (F = !0, o.tag === null && (o.tag = "?")), o.anchor !== null && M(o, o.anchor, o.result);
      }
      else T === 0 && (F = x && Fe(o, te));
    if (o.tag === null)
      o.anchor !== null && M(o, o.anchor, o.result);
    else if (o.tag === "?") {
      o.result !== null && o.kind !== "scalar" && J(o, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + o.kind + '"');
      for (let ae = 0, oe = o.implicitTypes.length; ae < oe; ae += 1)
        if (B = o.implicitTypes[ae], B.resolve(o.result)) {
          o.result = B.construct(o.result), o.tag = B.tag, o.anchor !== null && M(o, o.anchor, o.result);
          break;
        }
    } else if (o.tag !== "!") {
      if (r.call(o.typeMap[o.kind || "fallback"], o.tag)) B = o.typeMap[o.kind || "fallback"][o.tag];
      else {
        B = null;
        const ae = o.typeMap.multi[o.kind || "fallback"];
        for (let oe = 0, ve = ae.length; oe < ve; oe += 1) if (o.tag.slice(0, ae[oe].tag.length) === ae[oe].tag) {
          B = ae[oe];
          break;
        }
      }
      B || J(o, "unknown tag !<" + o.tag + ">"), o.result !== null && B.kind !== o.kind && J(o, "unacceptable node kind for !<" + o.tag + '> tag; it should be "' + B.kind + '", not "' + o.kind + '"'), B.resolve(o.result, o.tag) ? (o.result = B.construct(o.result, o.tag), o.anchor !== null && M(o, o.anchor, o.result)) : J(o, "cannot resolve a node with !<" + o.tag + "> explicit tag");
    }
    return o.listener !== null && o.listener("close", o), o.depth -= 1, o.tag !== null || o.anchor !== null || F;
  }
  function ln(o) {
    const R = o.position;
    let I = !1, N;
    for (o.version = null, o.checkLineBreaks = o.legacy, o.tagMap = /* @__PURE__ */ Object.create(null), o.anchorMap = /* @__PURE__ */ Object.create(null); (N = o.input.charCodeAt(o.position)) !== 0 && (q(o, !0, -1), N = o.input.charCodeAt(o.position), !(o.lineIndent > 0 || N !== 37)); ) {
      I = !0, N = o.input.charCodeAt(++o.position);
      let D = o.position;
      for (; N !== 0 && !A(N); ) N = o.input.charCodeAt(++o.position);
      const K = o.input.slice(D, o.position), x = [];
      for (K.length < 1 && J(o, "directive name must not be less than one character in length"); N !== 0; ) {
        for (; w(N); ) N = o.input.charCodeAt(++o.position);
        if (N === 35) {
          do
            N = o.input.charCodeAt(++o.position);
          while (N !== 0 && !E(N));
          break;
        }
        if (E(N)) break;
        for (D = o.position; N !== 0 && !A(N); ) N = o.input.charCodeAt(++o.position);
        x.push(o.input.slice(D, o.position));
      }
      N !== 0 && G(o), r.call(se, K) ? se[K](o, K, x) : k(o, 'unknown document directive "' + K + '"');
    }
    if (q(o, !0, -1), o.lineIndent === 0 && o.input.charCodeAt(o.position) === 45 && o.input.charCodeAt(o.position + 1) === 45 && o.input.charCodeAt(o.position + 2) === 45 ? (o.position += 3, q(o, !0, -1)) : I && J(o, "directives end mark is expected"), Ye(o, o.lineIndent - 1, m, !1, !0), q(o, !0, -1), o.checkLineBreaks && g.test(o.input.slice(R, o.position)) && k(o, "non-ASCII line breaks are interpreted as content"), o.documents.push(o.result), o.position === o.lineStart && ee(o)) {
      o.input.charCodeAt(o.position) === 46 && (o.position += 3, q(o, !0, -1));
      return;
    }
    o.position < o.length - 1 && J(o, "end of the stream or a document separator is expected");
  }
  function At(o, R) {
    o = String(o), R = R || {}, o.length !== 0 && (o.charCodeAt(o.length - 1) !== 10 && o.charCodeAt(o.length - 1) !== 13 && (o += `
`), o.charCodeAt(0) === 65279 && (o = o.slice(1)));
    const I = new he(o, R), N = o.indexOf("\0");
    for (N !== -1 && (I.position = N, J(I, "null byte is not allowed in input")), I.input += "\0"; I.input.charCodeAt(I.position) === 32; )
      I.lineIndent += 1, I.position += 1;
    for (; I.position < I.length - 1; ) ln(I);
    return I.documents;
  }
  function Ct(o, R, I) {
    R !== null && typeof R == "object" && typeof I > "u" && (I = R, R = null);
    const N = At(o, I);
    if (typeof R != "function") return N;
    for (let D = 0, K = N.length; D < K; D += 1) R(N[D]);
  }
  function un(o, R) {
    const I = At(o, R);
    if (I.length !== 0) {
      if (I.length === 1) return I[0];
      throw new i("expected a single document in the stream, but found more");
    }
  }
  e.exports.loadAll = Ct, e.exports.load = un;
})), tl = /* @__PURE__ */ Se(((a, e) => {
  var t = wt(), i = Et(), n = pa(), s = Object.prototype.toString, r = Object.prototype.hasOwnProperty, c = 65279, l = 9, p = 10, m = 13, u = 32, d = 33, v = 34, y = 35, g = 37, f = 38, h = 39, b = 42, S = 44, E = 45, w = 58, A = 61, O = 62, W = 63, X = 64, V = 91, pe = 93, me = 96, ke = 123, le = 124, fe = 125, he = {};
  he[0] = "\\0", he[7] = "\\a", he[8] = "\\b", he[9] = "\\t", he[10] = "\\n", he[11] = "\\v", he[12] = "\\f", he[13] = "\\r", he[27] = "\\e", he[34] = '\\"', he[92] = "\\\\", he[133] = "\\N", he[160] = "\\_", he[8232] = "\\L", he[8233] = "\\P";
  var we = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ], J = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function k(x, T) {
    if (T === null) return {};
    const H = {}, F = Object.keys(T);
    for (let L = 0, B = F.length; L < B; L += 1) {
      let j = F[L], te = String(T[j]);
      j.slice(0, 2) === "!!" && (j = "tag:yaml.org,2002:" + j.slice(2));
      const Q = x.compiledTypeMap.fallback[j];
      Q && r.call(Q.styleAliases, te) && (te = Q.styleAliases[te]), H[j] = te;
    }
    return H;
  }
  function M(x) {
    let T, H;
    const F = x.toString(16).toUpperCase();
    if (x <= 255)
      T = "x", H = 2;
    else if (x <= 65535)
      T = "u", H = 4;
    else if (x <= 4294967295)
      T = "U", H = 8;
    else throw new i("code point within a string may not be greater than 0xFFFFFFFF");
    return "\\" + T + t.repeat("0", H - F.length) + F;
  }
  var z = 1, Z = 2;
  function re(x) {
    this.schema = x.schema || n, this.indent = Math.max(1, x.indent || 2), this.noArrayIndent = x.noArrayIndent || !1, this.skipInvalid = x.skipInvalid || !1, this.flowLevel = t.isNothing(x.flowLevel) ? -1 : x.flowLevel, this.styleMap = k(this.schema, x.styles || null), this.sortKeys = x.sortKeys || !1, this.lineWidth = x.lineWidth || 80, this.noRefs = x.noRefs || !1, this.noCompatMode = x.noCompatMode || !1, this.condenseFlow = x.condenseFlow || !1, this.quotingType = x.quotingType === '"' ? Z : z, this.forceQuotes = x.forceQuotes || !1, this.replacer = typeof x.replacer == "function" ? x.replacer : null, this.implicitTypes = this.schema.compiledImplicit, this.explicitTypes = this.schema.compiledExplicit, this.tag = null, this.result = "", this.duplicates = [], this.usedDuplicates = null;
  }
  function de(x, T) {
    const H = t.repeat(" ", T);
    let F = 0, L = "";
    const B = x.length;
    for (; F < B; ) {
      let j;
      const te = x.indexOf(`
`, F);
      te === -1 ? (j = x.slice(F), F = B) : (j = x.slice(F, te + 1), F = te + 1), j.length && j !== `
` && (L += H), L += j;
    }
    return L;
  }
  function Y(x, T) {
    return `
` + t.repeat(" ", x.indent * T);
  }
  function se(x, T) {
    for (let H = 0, F = x.implicitTypes.length; H < F; H += 1) if (x.implicitTypes[H].resolve(T)) return !0;
    return !1;
  }
  function P(x) {
    return x === u || x === l;
  }
  function C(x) {
    return x >= 32 && x <= 126 || x >= 161 && x <= 55295 && x !== 8232 && x !== 8233 || x >= 57344 && x <= 65533 && x !== c || x >= 65536 && x <= 1114111;
  }
  function $(x) {
    return C(x) && x !== c && x !== m && x !== p;
  }
  function G(x, T, H) {
    const F = $(x), L = F && !P(x);
    return (H ? F : F && x !== S && x !== V && x !== pe && x !== ke && x !== fe) && x !== y && !(T === w && !L) || $(T) && !P(T) && x === y || T === w && L;
  }
  function q(x) {
    return C(x) && x !== c && !P(x) && x !== E && x !== W && x !== w && x !== S && x !== V && x !== pe && x !== ke && x !== fe && x !== y && x !== f && x !== b && x !== d && x !== le && x !== A && x !== O && x !== h && x !== v && x !== g && x !== X && x !== me;
  }
  function ee(x) {
    return !P(x) && x !== w;
  }
  function ne(x, T) {
    const H = x.charCodeAt(T);
    let F;
    return H >= 55296 && H <= 56319 && T + 1 < x.length && (F = x.charCodeAt(T + 1), F >= 56320 && F <= 57343) ? (H - 55296) * 1024 + F - 56320 + 65536 : H;
  }
  function ie(x) {
    return /^\n* /.test(x);
  }
  var ce = 1, _e = 2, be = 3, qe = 4, Fe = 5;
  function He(x, T, H, F, L, B, j, te) {
    let Q, ae = 0, oe = null, ve = !1, Re = !1;
    const wa = F !== -1;
    let dt = -1, mt = q(ne(x, 0)) && ee(ne(x, x.length - 1));
    if (T || j) for (Q = 0; Q < x.length; ae >= 65536 ? Q += 2 : Q++) {
      if (ae = ne(x, Q), !C(ae)) return Fe;
      mt = mt && G(ae, oe, te), oe = ae;
    }
    else {
      for (Q = 0; Q < x.length; ae >= 65536 ? Q += 2 : Q++) {
        if (ae = ne(x, Q), ae === p)
          ve = !0, wa && (Re = Re || Q - dt - 1 > F && x[dt + 1] !== " ", dt = Q);
        else if (!C(ae)) return Fe;
        mt = mt && G(ae, oe, te), oe = ae;
      }
      Re = Re || wa && Q - dt - 1 > F && x[dt + 1] !== " ";
    }
    return !ve && !Re ? mt && !j && !L(x) ? ce : B === Z ? Fe : _e : H > 9 && ie(x) ? Fe : j ? B === Z ? Fe : _e : Re ? qe : be;
  }
  function Me(x, T, H, F, L) {
    x.dump = (function() {
      if (T.length === 0) return x.quotingType === Z ? '""' : "''";
      if (!x.noCompatMode && (we.indexOf(T) !== -1 || J.test(T)))
        return x.quotingType === Z ? '"' + T + '"' : "'" + T + "'";
      const B = x.indent * Math.max(1, H), j = x.lineWidth === -1 ? -1 : Math.max(Math.min(x.lineWidth, 40), x.lineWidth - B), te = F || x.flowLevel > -1 && H >= x.flowLevel;
      function Q(ae) {
        return se(x, ae);
      }
      switch (He(T, te, x.indent, j, Q, x.quotingType, x.forceQuotes && !F, L)) {
        case ce:
          return T;
        case _e:
          return "'" + T.replace(/'/g, "''") + "'";
        case be:
          return "|" + Ke(T, x.indent) + ze(de(T, B));
        case qe:
          return ">" + Ke(T, x.indent) + ze(de(Ge(T, j), B));
        case Fe:
          return '"' + ln(T) + '"';
        default:
          throw new i("impossible error: invalid scalar style");
      }
    })();
  }
  function Ke(x, T) {
    const H = ie(x) ? String(T) : "", F = x[x.length - 1] === `
`;
    return H + (F && (x[x.length - 2] === `
` || x === `
`) ? "+" : F ? "" : "-") + `
`;
  }
  function ze(x) {
    return x[x.length - 1] === `
` ? x.slice(0, -1) : x;
  }
  function Ge(x, T) {
    const H = /(\n+)([^\n]*)/g;
    let F = (function() {
      let te = x.indexOf(`
`);
      return te = te !== -1 ? te : x.length, H.lastIndex = te, Ye(x.slice(0, te), T);
    })(), L = x[0] === `
` || x[0] === " ", B, j;
    for (; j = H.exec(x); ) {
      const te = j[1], Q = j[2];
      B = Q[0] === " ", F += te + (!L && !B && Q !== "" ? `
` : "") + Ye(Q, T), L = B;
    }
    return F;
  }
  function Ye(x, T) {
    if (x === "" || x[0] === " ") return x;
    const H = / [^ ]/g;
    let F, L = 0, B, j = 0, te = 0, Q = "";
    for (; F = H.exec(x); )
      te = F.index, te - L > T && (B = j > L ? j : te, Q += `
` + x.slice(L, B), L = B + 1), j = te;
    return Q += `
`, x.length - L > T && j > L ? Q += x.slice(L, j) + `
` + x.slice(j + 1) : Q += x.slice(L), Q.slice(1);
  }
  function ln(x) {
    let T = "", H = 0;
    for (let F = 0; F < x.length; H >= 65536 ? F += 2 : F++) {
      H = ne(x, F);
      const L = he[H];
      !L && C(H) ? (T += x[F], H >= 65536 && (T += x[F + 1])) : T += L || M(H);
    }
    return T;
  }
  function At(x, T, H) {
    let F = "";
    const L = x.tag;
    for (let B = 0, j = H.length; B < j; B += 1) {
      let te = H[B];
      x.replacer && (te = x.replacer.call(H, String(B), te)), (I(x, T, te, !1, !1) || typeof te > "u" && I(x, T, null, !1, !1)) && (F !== "" && (F += "," + (x.condenseFlow ? "" : " ")), F += x.dump);
    }
    x.tag = L, x.dump = "[" + F + "]";
  }
  function Ct(x, T, H, F) {
    let L = "";
    const B = x.tag;
    for (let j = 0, te = H.length; j < te; j += 1) {
      let Q = H[j];
      x.replacer && (Q = x.replacer.call(H, String(j), Q)), (I(x, T + 1, Q, !0, !0, !1, !0) || typeof Q > "u" && I(x, T + 1, null, !0, !0, !1, !0)) && ((!F || L !== "") && (L += Y(x, T)), x.dump && p === x.dump.charCodeAt(0) ? L += "-" : L += "- ", L += x.dump);
    }
    x.tag = B, x.dump = L || "[]";
  }
  function un(x, T, H) {
    let F = "";
    const L = x.tag, B = Object.keys(H);
    for (let j = 0, te = B.length; j < te; j += 1) {
      let Q = "";
      F !== "" && (Q += ", "), x.condenseFlow && (Q += '"');
      const ae = B[j];
      let oe = H[ae];
      x.replacer && (oe = x.replacer.call(H, ae, oe)), I(x, T, ae, !1, !1) && (x.dump.length > 1024 && (Q += "? "), Q += x.dump + (x.condenseFlow ? '"' : "") + ":" + (x.condenseFlow ? "" : " "), I(x, T, oe, !1, !1) && (Q += x.dump, F += Q));
    }
    x.tag = L, x.dump = "{" + F + "}";
  }
  function o(x, T, H, F) {
    let L = "";
    const B = x.tag, j = Object.keys(H);
    if (x.sortKeys === !0) j.sort();
    else if (typeof x.sortKeys == "function") j.sort(x.sortKeys);
    else if (x.sortKeys) throw new i("sortKeys must be a boolean or a function");
    for (let te = 0, Q = j.length; te < Q; te += 1) {
      let ae = "";
      (!F || L !== "") && (ae += Y(x, T));
      const oe = j[te];
      let ve = H[oe];
      if (x.replacer && (ve = x.replacer.call(H, oe, ve)), !I(x, T + 1, oe, !0, !0, !0)) continue;
      const Re = x.tag !== null && x.tag !== "?" || x.dump && x.dump.length > 1024;
      Re && (x.dump && p === x.dump.charCodeAt(0) ? ae += "?" : ae += "? "), ae += x.dump, Re && (ae += Y(x, T)), I(x, T + 1, ve, !0, Re) && (x.dump && p === x.dump.charCodeAt(0) ? ae += ":" : ae += ": ", ae += x.dump, L += ae);
    }
    x.tag = B, x.dump = L || "{}";
  }
  function R(x, T, H) {
    const F = H ? x.explicitTypes : x.implicitTypes;
    for (let L = 0, B = F.length; L < B; L += 1) {
      const j = F[L];
      if ((j.instanceOf || j.predicate) && (!j.instanceOf || typeof T == "object" && T instanceof j.instanceOf) && (!j.predicate || j.predicate(T))) {
        if (H ? j.multi && j.representName ? x.tag = j.representName(T) : x.tag = j.tag : x.tag = "?", j.represent) {
          const te = x.styleMap[j.tag] || j.defaultStyle;
          let Q;
          if (s.call(j.represent) === "[object Function]") Q = j.represent(T, te);
          else if (r.call(j.represent, te)) Q = j.represent[te](T, te);
          else throw new i("!<" + j.tag + '> tag resolver accepts not "' + te + '" style');
          x.dump = Q;
        }
        return !0;
      }
    }
    return !1;
  }
  function I(x, T, H, F, L, B, j) {
    x.tag = null, x.dump = H, R(x, H, !1) || R(x, H, !0);
    const te = s.call(x.dump), Q = F;
    F && (F = x.flowLevel < 0 || x.flowLevel > T);
    const ae = te === "[object Object]" || te === "[object Array]";
    let oe, ve;
    if (ae && (oe = x.duplicates.indexOf(H), ve = oe !== -1), (x.tag !== null && x.tag !== "?" || ve || x.indent !== 2 && T > 0) && (L = !1), ve && x.usedDuplicates[oe]) x.dump = "*ref_" + oe;
    else {
      if (ae && ve && !x.usedDuplicates[oe] && (x.usedDuplicates[oe] = !0), te === "[object Object]") F && Object.keys(x.dump).length !== 0 ? (o(x, T, x.dump, L), ve && (x.dump = "&ref_" + oe + x.dump)) : (un(x, T, x.dump), ve && (x.dump = "&ref_" + oe + " " + x.dump));
      else if (te === "[object Array]") F && x.dump.length !== 0 ? (x.noArrayIndent && !j && T > 0 ? Ct(x, T - 1, x.dump, L) : Ct(x, T, x.dump, L), ve && (x.dump = "&ref_" + oe + x.dump)) : (At(x, T, x.dump), ve && (x.dump = "&ref_" + oe + " " + x.dump));
      else if (te === "[object String]")
        x.tag !== "?" && Me(x, x.dump, T, B, Q);
      else {
        if (te === "[object Undefined]") return !1;
        if (x.skipInvalid) return !1;
        throw new i("unacceptable kind of an object to dump " + te);
      }
      if (x.tag !== null && x.tag !== "?") {
        let Re = encodeURI(x.tag[0] === "!" ? x.tag.slice(1) : x.tag).replace(/!/g, "%21");
        x.tag[0] === "!" ? Re = "!" + Re : Re.slice(0, 18) === "tag:yaml.org,2002:" ? Re = "!!" + Re.slice(18) : Re = "!<" + Re + ">", x.dump = Re + " " + x.dump;
      }
    }
    return !0;
  }
  function N(x, T) {
    const H = [], F = [];
    D(x, H, F);
    const L = F.length;
    for (let B = 0; B < L; B += 1) T.duplicates.push(H[F[B]]);
    T.usedDuplicates = new Array(L);
  }
  function D(x, T, H) {
    if (x !== null && typeof x == "object") {
      const F = T.indexOf(x);
      if (F !== -1)
        H.indexOf(F) === -1 && H.push(F);
      else if (T.push(x), Array.isArray(x)) for (let L = 0, B = x.length; L < B; L += 1) D(x[L], T, H);
      else {
        const L = Object.keys(x);
        for (let B = 0, j = L.length; B < j; B += 1) D(x[L[B]], T, H);
      }
    }
  }
  function K(x, T) {
    T = T || {};
    const H = new re(T);
    H.noRefs || N(x, H);
    let F = x;
    return H.replacer && (F = H.replacer.call({ "": F }, "", F)), I(H, 0, F, !0, !0) ? H.dump + `
` : "";
  }
  e.exports.dump = K;
})), yo = /* @__PURE__ */ Qc((/* @__PURE__ */ Se(((a, e) => {
  var t = el(), i = tl();
  function n(s, r) {
    return function() {
      throw new Error("Function yaml." + s + " is removed in js-yaml 4. Use yaml." + r + " instead, which is now safe by default.");
    };
  }
  e.exports.Type = Pe(), e.exports.Schema = to(), e.exports.FAILSAFE_SCHEMA = ro(), e.exports.JSON_SCHEMA = uo(), e.exports.CORE_SCHEMA = po(), e.exports.DEFAULT_SCHEMA = pa(), e.exports.load = t.load, e.exports.loadAll = t.loadAll, e.exports.dump = i.dump, e.exports.YAMLException = Et(), e.exports.types = {
    binary: ho(),
    float: lo(),
    map: ao(),
    null: so(),
    pairs: xo(),
    set: go(),
    timestamp: mo(),
    bool: oo(),
    int: co(),
    merge: fo(),
    omap: vo(),
    seq: io(),
    str: no()
  }, e.exports.safeLoad = n("safeLoad", "load"), e.exports.safeLoadAll = n("safeLoadAll", "loadAll"), e.exports.safeDump = n("safeDump", "dump");
})))()), { Type: bm, Schema: _m, FAILSAFE_SCHEMA: wm, JSON_SCHEMA: Em, CORE_SCHEMA: Sm, DEFAULT_SCHEMA: Rm, load: km, loadAll: Tm, dump: Am, YAMLException: Cm, types: Om, safeLoad: Dm, safeLoadAll: Im, safeDump: Pm } = yo.default, Lt = yo.default;
class bo {
  constructor() {
    ue(this, "signatures", []);
    ue(this, "matchers");
    ue(this, "lastMatchTime", /* @__PURE__ */ new Map());
    ue(this, "cooldownMs", 3e3);
    this.matchers = /* @__PURE__ */ new Map([
      ["sequence", new nl()],
      ["statistical", new il()],
      ["mouse", new al()],
      ["regex", new rl()]
    ]);
  }
  async loadFromFile(e) {
    const t = await Xe.readFile(e, "utf-8");
    return this.loadFromString(t, e);
  }
  async loadFromDirectory(e) {
    const i = (await Xe.readdir(e)).filter((s) => s.endsWith(".yaml") || s.endsWith(".yml"));
    let n = 0;
    for (const s of i) {
      const r = ye.join(e, s);
      try {
        const c = await this.loadFromFile(r);
        n += c;
      } catch {
      }
    }
    return n;
  }
  loadFromString(e, t = "inline") {
    const i = Lt.load(e), n = this.normalizeYamlInput(i), s = [];
    for (const r of n) {
      const c = this.convertYamlToSignature(r, t);
      c && s.push(c);
    }
    return this.signatures = [...this.signatures, ...s], s.length;
  }
  normalizeYamlInput(e) {
    return e ? Array.isArray(e) ? e : typeof e == "object" && "signatures" in e ? e.signatures : [e] : [];
  }
  convertYamlToSignature(e, t) {
    if (!e.id || !e.name || !e.pattern)
      return null;
    const i = this.convertYamlPattern(e.pattern);
    return i ? {
      id: We.randomUUID(),
      signatureId: e.id,
      name: e.name,
      description: e.description || "",
      severity: e.severity || "medium",
      pattern: i,
      patternYaml: Lt.dump(e.pattern),
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date(),
      source: "local"
    } : null;
  }
  convertYamlPattern(e) {
    var n;
    const t = e.type;
    if (!t) return null;
    const i = { type: t };
    switch (t) {
      case "sequence":
        i.events = (n = e.events) == null ? void 0 : n.map((s) => ({
          type: s.type,
          keys: s.keys,
          value: s.value,
          contains: s.contains,
          regex: s.regex,
          window: s.window || 1e3
        }));
        break;
      case "statistical":
        i.metric = e.metric, i.threshold = e.threshold, i.window = e.window;
        break;
      case "mouse":
        i.movement = e.movement, i.duration = e.duration, i.threshold = e.min_speed || e.threshold;
        break;
      case "regex":
        i.threshold = e.threshold, i.window = e.window;
        break;
    }
    return i;
  }
  match(e) {
    const t = [], i = Date.now();
    for (const n of this.signatures) {
      const s = this.lastMatchTime.get(n.signatureId) || 0;
      if (i - s < this.cooldownMs) continue;
      const r = this.matchers.get(n.pattern.type);
      if (!r) continue;
      const c = r.match(e, n.pattern);
      if (c && c.matched) {
        this.lastMatchTime.set(n.signatureId, i);
        const l = this.createAlert(n, c, e);
        t.push(l);
      }
    }
    return t;
  }
  createAlert(e, t, i) {
    const n = t.matchedEvents || i.slice(-20), s = this.extractDevice(n), r = this.generateSequenceHash(n);
    return {
      id: We.randomUUID(),
      timestamp: /* @__PURE__ */ new Date(),
      device: s,
      severity: e.severity,
      reason: `签名匹配: ${e.name} - ${t.reason}`,
      matchedSignatures: [e.signatureId, e.name],
      inputSequence: n,
      riskScore: this.calculateRiskScore(e.severity),
      inputSequenceHash: r,
      isReviewed: !1
    };
  }
  extractDevice(e) {
    var n;
    const t = e.find((s) => s.device);
    return t != null && t.device ? t.device : {
      vendorId: 0,
      productId: 0,
      manufacturer: "Unknown",
      productName: "Unknown HID Device",
      serialNumber: "",
      devicePath: ((n = e[0]) == null ? void 0 : n.devicePath) || "",
      firstSeen: /* @__PURE__ */ new Date()
    };
  }
  generateSequenceHash(e) {
    const t = e.filter((i) => i.keyCode).map((i) => {
      var n;
      return `${i.keyCode}:${((n = i.modifiers) == null ? void 0 : n.join("+")) || ""}`;
    }).join("|");
    return We.createHash("sha256").update(t).digest("hex");
  }
  calculateRiskScore(e) {
    return {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100
    }[e] || 50;
  }
  addSignature(e) {
    const t = this.signatures.findIndex((i) => i.signatureId === e.signatureId);
    t >= 0 ? this.signatures[t] = e : this.signatures.push(e);
  }
  removeSignature(e) {
    const t = this.signatures.length;
    return this.signatures = this.signatures.filter((i) => i.signatureId !== e), this.signatures.length < t;
  }
  getSignatures() {
    return [...this.signatures];
  }
  getSignatureById(e) {
    return this.signatures.find((t) => t.signatureId === e);
  }
  clearSignatures() {
    this.signatures = [], this.lastMatchTime.clear();
  }
  getSignatureCount() {
    return this.signatures.length;
  }
  async saveSignaturesToFile(e) {
    const t = {
      signatures: this.signatures.map((i) => ({
        id: i.signatureId,
        name: i.name,
        description: i.description,
        severity: i.severity,
        pattern: Lt.load(i.patternYaml)
      }))
    };
    await Xe.writeFile(e, Lt.dump(t, { indent: 2 }));
  }
}
class nl {
  match(e, t) {
    if (!t.events || t.events.length === 0) return null;
    const i = t.events, n = i[0].window || 5e3, s = [];
    let r = 0, c = 0, l = -1;
    for (; r < e.length && c < i.length; ) {
      const p = e[r], m = i[c], u = p.timestamp instanceof Date ? p.timestamp.getTime() : new Date(p.timestamp).getTime();
      if (l === -1 && (l = u), u - l > n) {
        r = r - c + 1, c = 0, l = -1, s.length = 0;
        continue;
      }
      if (this.matchEvent(p, m) && (s.push(p), c++, c === i.length))
        return {
          matched: !0,
          signatureId: "",
          signatureName: "",
          severity: "medium",
          reason: `序列匹配: ${i.map((d) => {
            var v;
            return d.value || ((v = d.keys) == null ? void 0 : v.join("+")) || d.type;
          }).join(" -> ")}`,
          matchedEvents: s
        };
      r++;
    }
    return null;
  }
  matchEvent(e, t) {
    var i;
    switch (t.type) {
      case "key":
        return e.keyName === t.value || ((i = e.modifiers) == null ? void 0 : i.length) === 0 && e.keyName === t.value;
      case "shortcut":
        if (!t.keys || !e.modifiers) return !1;
        const s = t.keys.filter((c) => c !== t.value).every((c) => e.modifiers.includes(c)), r = !t.value || e.keyName === t.value;
        return s && r;
      case "string":
        return !t.contains || !e.keyName ? !1 : e.keyName.toLowerCase().includes(t.contains.toLowerCase());
      case "regex":
        if (!t.regex || !e.keyName) return !1;
        try {
          return new RegExp(t.regex, "i").test(e.keyName);
        } catch {
          return !1;
        }
      default:
        return !1;
    }
  }
}
class il {
  match(e, t) {
    if (!t.metric || t.threshold === void 0) return null;
    const i = t.window || 5e3, n = this.getRecentEvents(e, i);
    let s = 0, r = t.metric;
    switch (t.metric) {
      case "typing_speed":
        s = this.calculateTypingSpeed(n), r = "输入速度";
        break;
      case "shortcut_density":
        s = this.calculateShortcutDensity(n), r = "快捷键密度";
        break;
      case "interval_variance":
        s = this.calculateIntervalVariance(n), r = "输入间隔方差";
        break;
      case "average_interval":
        s = this.calculateAverageInterval(n), r = "平均输入间隔";
        break;
      case "event_count":
        s = n.length, r = "事件数量";
        break;
      default:
        return null;
    }
    return s >= t.threshold ? {
      matched: !0,
      signatureId: "",
      signatureName: "",
      severity: "medium",
      reason: `统计指标异常: ${r} = ${s.toFixed(2)} (阈值: ${t.threshold})`,
      matchedEvents: n
    } : null;
  }
  getRecentEvents(e, t) {
    if (e.length === 0) return [];
    const i = Date.now();
    return e.filter((n) => {
      const s = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp).getTime();
      return i - s <= t;
    });
  }
  calculateTypingSpeed(e) {
    const t = e.filter((r) => r.type === "keyboard" && r.keyCode);
    if (t.length < 2) return 0;
    const i = t[0].timestamp instanceof Date ? t[0].timestamp.getTime() : new Date(t[0].timestamp).getTime(), s = ((t[t.length - 1].timestamp instanceof Date ? t[t.length - 1].timestamp.getTime() : new Date(t[t.length - 1].timestamp).getTime()) - i) / 6e4;
    return s <= 0 ? 0 : t.length / s;
  }
  calculateShortcutDensity(e) {
    return e.filter((t) => t.isModifier && t.modifiers && t.modifiers.length > 0).length;
  }
  calculateIntervalVariance(e) {
    if (e.length < 3) return 0;
    const t = [];
    for (let s = 1; s < e.length; s++) {
      const r = e[s - 1].timestamp instanceof Date ? e[s - 1].timestamp.getTime() : new Date(e[s - 1].timestamp).getTime(), c = e[s].timestamp instanceof Date ? e[s].timestamp.getTime() : new Date(e[s].timestamp).getTime();
      t.push(c - r);
    }
    const i = t.reduce((s, r) => s + r, 0) / t.length, n = t.map((s) => Math.pow(s - i, 2));
    return n.reduce((s, r) => s + r, 0) / n.length;
  }
  calculateAverageInterval(e) {
    if (e.length < 2) return 0;
    let t = 0;
    for (let i = 1; i < e.length; i++) {
      const n = e[i - 1].timestamp instanceof Date ? e[i - 1].timestamp.getTime() : new Date(e[i - 1].timestamp).getTime(), s = e[i].timestamp instanceof Date ? e[i].timestamp.getTime() : new Date(e[i].timestamp).getTime();
      t += s - n;
    }
    return t / (e.length - 1);
  }
}
class al {
  match(e, t) {
    const i = e.filter((c) => c.type === "mouse");
    if (i.length < 5) return null;
    const n = t.duration || 2e3, s = t.threshold || 5, r = this.getRecentEvents(i, n);
    switch (t.movement) {
      case "edge_movement":
        return this.detectEdgeMovement(r, s);
      case "instant_jump":
        return this.detectInstantJump(r, s);
      case "circular":
        return this.detectCircularMovement(r, s);
      case "straight_line":
        return this.detectStraightLine(r, s);
      default:
        return this.detectSuspiciousMovement(r, s);
    }
  }
  getRecentEvents(e, t) {
    if (e.length === 0) return [];
    const i = Date.now();
    return e.filter((n) => {
      const s = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp).getTime();
      return i - s <= t;
    });
  }
  detectEdgeMovement(e, t) {
    let r = 960, c = 1080 / 2, l = 0;
    for (const p of e)
      p.mouseX !== void 0 && (r += p.mouseX), p.mouseY !== void 0 && (c += p.mouseY), r = Math.max(0, Math.min(1920, r)), c = Math.max(0, Math.min(1080, c)), (r <= 50 || r >= 1870 || c <= 50 || c >= 1030) && l++;
    return l >= t ? {
      matched: !0,
      signatureId: "",
      signatureName: "",
      severity: "medium",
      reason: `鼠标边缘移动检测: ${l} 次边缘接触 (阈值: ${t})`,
      matchedEvents: e
    } : null;
  }
  detectInstantJump(e, t) {
    for (const i of e) {
      const n = Math.sqrt(
        Math.pow(i.mouseX || 0, 2) + Math.pow(i.mouseY || 0, 2)
      );
      if (n >= t * 10)
        return {
          matched: !0,
          signatureId: "",
          signatureName: "",
          severity: "high",
          reason: `鼠标瞬时跳跃检测: 距离 = ${n.toFixed(2)}px`,
          matchedEvents: [i]
        };
    }
    return null;
  }
  detectCircularMovement(e, t) {
    if (e.length < 8) return null;
    let i = 0;
    for (let n = 2; n < e.length; n++) {
      const s = e[n - 1].mouseX || 0, r = e[n - 1].mouseY || 0, c = e[n].mouseX || 0, l = e[n].mouseY || 0, p = s * c + r * l, m = Math.sqrt(s * s + r * r), u = Math.sqrt(c * c + l * l);
      if (m > 0 && u > 0) {
        const d = Math.max(-1, Math.min(1, p / (m * u)));
        i += Math.acos(d);
      }
    }
    return i >= t * Math.PI ? {
      matched: !0,
      signatureId: "",
      signatureName: "",
      severity: "medium",
      reason: `鼠标圆周运动检测: 总角度 = ${(i / Math.PI).toFixed(2)}π`,
      matchedEvents: e
    } : null;
  }
  detectStraightLine(e, t) {
    if (e.length < t) return null;
    let i = 0, n = 0, s = 0;
    for (let r = 1; r < e.length; r++) {
      const c = e[r].mouseX || 0, l = e[r].mouseY || 0;
      if (r > 1) {
        const p = c > 0 && n > 0 || c < 0 && n < 0 || c === 0 && n === 0, m = l > 0 && s > 0 || l < 0 && s < 0 || l === 0 && s === 0;
        p && m && i++;
      }
      n = c, s = l;
    }
    return i >= t ? {
      matched: !0,
      signatureId: "",
      signatureName: "",
      severity: "low",
      reason: `鼠标直线运动检测: 连续同方向移动 ${i} 次`,
      matchedEvents: e
    } : null;
  }
  detectSuspiciousMovement(e, t) {
    const i = e.reduce((n, s) => n + Math.sqrt(Math.pow(s.mouseX || 0, 2) + Math.pow(s.mouseY || 0, 2)), 0) / e.length;
    return i > t * 3 ? {
      matched: !0,
      signatureId: "",
      signatureName: "",
      severity: "medium",
      reason: `可疑鼠标移动检测: 平均移动距离 = ${i.toFixed(2)}px`,
      matchedEvents: e
    } : null;
  }
}
class rl {
  match(e, t) {
    if (!t.threshold) return null;
    const i = t.window || 1e4, n = this.getRecentEvents(e, i), s = n.filter((c) => c.type === "keyboard" && c.keyName && c.keyName.length === 1).map((c) => c.keyName).join("");
    if (s.length < 3) return null;
    const r = [
      { regex: /powershell|cmd\.exe|bash/i, name: "PowerShell/命令行" },
      { regex: /net\s+user|net\s+localgroup/i, name: "用户账户操作" },
      { regex: /whoami|ipconfig|ifconfig/i, name: "系统信息收集" },
      { regex: /reg\s+add|reg\s+delete/i, name: "注册表操作" },
      { regex: /schtasks|at\s+\/interactive/i, name: "计划任务创建" },
      { regex: /invoke\-|iex\s*\(|start\-process/i, name: "PowerShell执行" },
      { regex: /curl|wget|http:\/\/|https:\/\//i, name: "网络请求" },
      { regex: /cscript|wscript|mshta/i, name: "脚本执行" }
    ];
    for (const c of r)
      if (c.regex.test(s))
        return {
          matched: !0,
          signatureId: "",
          signatureName: "",
          severity: "high",
          reason: `正则匹配: 检测到 "${c.name}" 模式`,
          matchedEvents: n
        };
    return null;
  }
  getRecentEvents(e, t) {
    if (e.length === 0) return [];
    const i = Date.now();
    return e.filter((n) => {
      const s = n.timestamp instanceof Date ? n.timestamp.getTime() : new Date(n.timestamp).getTime();
      return i - s <= t;
    });
  }
}
const sl = /* @__PURE__ */ new Set([
  "delay",
  "sleep",
  "wait",
  "key",
  "press",
  "type",
  "string",
  "text",
  "mouse",
  "move",
  "click",
  "leftclick",
  "rightclick",
  "middleclick",
  "doubleclick",
  "repeat",
  "loop",
  "if",
  "elif",
  "else",
  "endif",
  "ifos",
  "os",
  "var",
  "let",
  "set",
  "include",
  "import",
  "require",
  "end",
  "true",
  "false",
  "infinite",
  "current",
  "relative",
  "absolute"
]), ol = /* @__PURE__ */ new Set([
  "ctrl",
  "control",
  "alt",
  "option",
  "shift",
  "cmd",
  "command",
  "win",
  "windows",
  "meta",
  "super"
]), cl = /* @__PURE__ */ new Set(["windows", "win", "mac", "macos", "darwin", "linux", "unix"]), ll = /* @__PURE__ */ new Set(["ms", "s", "sec", "min", "h"]);
class ul {
  constructor(e) {
    ue(this, "input");
    ue(this, "pos", 0);
    ue(this, "line", 1);
    ue(this, "column", 1);
    ue(this, "tokens", []);
    ue(this, "errors", []);
    this.input = e;
  }
  tokenize() {
    for (; this.pos < this.input.length && (this.skipWhitespace(), !(this.pos >= this.input.length)); ) {
      this.pos;
      const e = this.line, t = this.column, i = this.input[this.pos];
      if (i === '"' || i === "'") {
        this.readString(i);
        continue;
      }
      if (i === "#") {
        this.readComment();
        continue;
      }
      if (i === "/" && this.input[this.pos + 1] === "/") {
        this.readComment();
        continue;
      }
      if (this.isDigit(i)) {
        this.readNumber();
        continue;
      }
      if (this.isLetter(i) || i === "_") {
        this.readIdentifier();
        continue;
      }
      if (i === "$") {
        this.readVariable();
        continue;
      }
      if (i === "@") {
        this.tokens.push(this.createToken("At", "@", e, t)), this.advance();
        continue;
      }
      const n = this.readSymbol(i, e, t);
      if (n) {
        this.tokens.push(n), this.advance();
        continue;
      }
      this.errors.push({
        line: e,
        column: t,
        message: `Unexpected character '${i}'`
      }), this.advance();
    }
    return this.tokens.push(this.createToken("EOF", "", this.line, this.column)), { tokens: this.tokens, errors: this.errors };
  }
  skipWhitespace() {
    for (; this.pos < this.input.length; ) {
      const e = this.input[this.pos];
      if (e === " " || e === "	" || e === "\r")
        this.advance();
      else if (e === `
`)
        this.line++, this.column = 1, this.pos++;
      else
        break;
    }
  }
  readComment() {
    for (; this.pos < this.input.length && this.input[this.pos] !== `
`; )
      this.advance();
  }
  readString(e) {
    const t = this.line, i = this.column;
    this.advance();
    let n = "";
    const s = this.pos;
    for (; this.pos < this.input.length; ) {
      const c = this.input[this.pos];
      if (c === "\\" && this.pos + 1 < this.input.length) {
        const l = this.input[this.pos + 1];
        switch (l) {
          case "n":
            n += `
`;
            break;
          case "t":
            n += "	";
            break;
          case "r":
            n += "\r";
            break;
          case "\\":
            n += "\\";
            break;
          case '"':
            n += '"';
            break;
          case "'":
            n += "'";
            break;
          default:
            n += l;
        }
        this.advance(), this.advance();
        continue;
      }
      if (c === e)
        break;
      if (c === `
`) {
        this.errors.push({
          line: t,
          column: i,
          message: "Unterminated string literal"
        });
        return;
      }
      n += c, this.advance();
    }
    if (this.pos >= this.input.length) {
      this.errors.push({
        line: t,
        column: i,
        message: "Unterminated string literal"
      });
      return;
    }
    const r = this.input.substring(s - 1, this.pos + 1);
    this.tokens.push(this.createToken("String", n, t, i, r)), this.advance();
  }
  readNumber() {
    const e = this.line, t = this.column, i = this.pos;
    for (; this.pos < this.input.length && this.isDigit(this.input[this.pos]); )
      this.advance();
    if (this.pos < this.input.length && this.input[this.pos] === ".")
      for (this.advance(); this.pos < this.input.length && this.isDigit(this.input[this.pos]); )
        this.advance();
    const n = this.input.substring(i, this.pos);
    this.tokens.push(this.createToken("Number", n, e, t));
  }
  readIdentifier() {
    const e = this.line, t = this.column, i = this.pos;
    for (; this.pos < this.input.length && (this.isLetterOrDigit(this.input[this.pos]) || this.input[this.pos] === "_"); )
      this.advance();
    const n = this.input.substring(i, this.pos), s = n.toLowerCase();
    let r = "Identifier";
    sl.has(s) ? r = "Keyword" : ol.has(s) ? r = "Modifier" : cl.has(s) ? r = "OS" : ll.has(s) && (r = "Unit"), this.tokens.push(this.createToken(r, n, e, t));
  }
  readVariable() {
    const e = this.line, t = this.column, i = this.pos;
    if (this.advance(), this.pos < this.input.length && this.input[this.pos] === "{") {
      this.advance();
      const n = this.pos;
      for (; this.pos < this.input.length && this.input[this.pos] !== "}" && this.input[this.pos] !== `
`; )
        this.advance();
      if (this.pos >= this.input.length || this.input[this.pos] !== "}") {
        this.errors.push({
          line: e,
          column: t,
          message: "Unterminated variable reference"
        });
        return;
      }
      const s = this.input.substring(n, this.pos), r = this.input.substring(i, this.pos + 1);
      this.tokens.push(this.createToken("Dollar", s, e, t, r)), this.advance();
    } else {
      const n = this.pos;
      for (; this.pos < this.input.length && (this.isLetterOrDigit(this.input[this.pos]) || this.input[this.pos] === "_"); )
        this.advance();
      const s = this.input.substring(n, this.pos), r = this.input.substring(i, this.pos);
      this.tokens.push(this.createToken("Dollar", s, e, t, r));
    }
  }
  readSymbol(e, t, i) {
    switch (e) {
      case "(":
        return this.createToken("LParen", "(", t, i);
      case ")":
        return this.createToken("RParen", ")", t, i);
      case "{":
        return this.createToken("LBrace", "{", t, i);
      case "}":
        return this.createToken("RBrace", "}", t, i);
      case "[":
        return this.createToken("LBracket", "[", t, i);
      case "]":
        return this.createToken("RBracket", "]", t, i);
      case ",":
        return this.createToken("Comma", ",", t, i);
      case ":":
        return this.createToken("Colon", ":", t, i);
      case ";":
        return this.createToken("Semicolon", ";", t, i);
      case "+":
        return this.createToken("Plus", "+", t, i);
      case "-":
        return this.createToken("Minus", "-", t, i);
      case "*":
        return this.createToken("Star", "*", t, i);
      case "/":
        return this.createToken("Slash", "/", t, i);
      case "=":
        return this.createToken("Equals", "=", t, i);
      case "#":
        return this.createToken("Hash", "#", t, i);
      default:
        return null;
    }
  }
  advance() {
    this.pos++, this.column++;
  }
  isDigit(e) {
    return e >= "0" && e <= "9";
  }
  isLetter(e) {
    return e >= "a" && e <= "z" || e >= "A" && e <= "Z";
  }
  isLetterOrDigit(e) {
    return this.isLetter(e) || this.isDigit(e);
  }
  createToken(e, t, i, n, s) {
    return {
      type: e,
      value: t,
      raw: s ?? t,
      line: i,
      column: n
    };
  }
}
class sr {
  constructor() {
    ue(this, "tokens", []);
    ue(this, "pos", 0);
    ue(this, "errors", []);
    ue(this, "warnings", []);
    ue(this, "variables", /* @__PURE__ */ new Map());
    ue(this, "includes", []);
  }
  parseScript(e) {
    this.reset();
    const t = new ul(e), { tokens: i, errors: n } = t.tokenize();
    this.tokens = i;
    for (const r of n)
      this.errors.push({
        line: r.line,
        column: r.column,
        message: r.message
      });
    let s = null;
    try {
      s = this.parseProgram();
    } catch (r) {
      const c = r;
      this.errors.push({
        line: 1,
        column: 1,
        message: `Parse error: ${c.message}`
      });
    }
    return {
      ast: s,
      errors: [...this.errors],
      warnings: [...this.warnings],
      variables: new Map(this.variables),
      includes: [...this.includes]
    };
  }
  reset() {
    this.tokens = [], this.pos = 0, this.errors = [], this.warnings = [], this.variables = /* @__PURE__ */ new Map(), this.includes = [];
  }
  current() {
    return this.tokens[this.pos];
  }
  peek(e = 1) {
    return this.tokens[this.pos + e] ?? this.tokens[this.tokens.length - 1];
  }
  consume(e, t) {
    const i = this.current();
    if (i.type !== e) {
      const n = t ? `Expected ${t}, got '${i.value}'` : `Expected token type ${e}, got ${i.type} ('${i.value}')`;
      this.errors.push({
        line: i.line,
        column: i.column,
        message: n
      });
    }
    return this.pos++, i;
  }
  match(e, t) {
    const i = this.current();
    return !(i.type !== e || t !== void 0 && i.value.toLowerCase() !== t.toLowerCase());
  }
  matchKeyword(e) {
    return this.match("Keyword", e);
  }
  consumeKeyword(e) {
    const t = this.current();
    return this.matchKeyword(e) || this.errors.push({
      line: t.line,
      column: t.column,
      message: `Expected keyword '${e}', got '${t.value}'`
    }), this.pos++, t;
  }
  parseProgram() {
    const e = this.current(), t = [];
    for (; !this.match("EOF"); ) {
      const i = this.parseStatement();
      i && t.push(i);
    }
    return {
      type: "Program",
      body: t,
      line: e.line,
      column: e.column
    };
  }
  parseStatement() {
    const e = this.current();
    return this.match("Semicolon") || this.match("EOF") ? (this.pos++, null) : this.match("At") ? this.parseInclude() : this.matchKeyword("var") || this.matchKeyword("let") || this.matchKeyword("set") ? this.parseAssignment() : this.match("Dollar") ? this.parseVarOrAssignment() : this.matchKeyword("delay") || this.matchKeyword("sleep") || this.matchKeyword("wait") ? this.parseDelay() : this.matchKeyword("type") || this.matchKeyword("string") || this.matchKeyword("text") ? this.parseString() : this.matchKeyword("key") || this.matchKeyword("press") ? this.parseKey() : this.matchKeyword("move") || this.matchKeyword("mouse") ? this.parseMouseMove() : this.matchKeyword("click") || this.matchKeyword("leftclick") || this.matchKeyword("rightclick") || this.matchKeyword("middleclick") || this.matchKeyword("doubleclick") ? this.parseMouseClick() : this.matchKeyword("repeat") || this.matchKeyword("loop") ? this.parseRepeat() : this.matchKeyword("ifos") || this.matchKeyword("if") ? this.parseIfOS() : this.matchKeyword("end") || this.matchKeyword("endif") || this.matchKeyword("else") || this.matchKeyword("elif") ? (this.warnings.push({
      line: e.line,
      column: e.column,
      message: `Unexpected '${e.value}' outside of block`
    }), this.pos++, null) : this.match("String") ? this.parseStringLiteral() : (this.errors.push({
      line: e.line,
      column: e.column,
      message: `Unexpected token '${e.value}'`
    }), this.pos++, null);
  }
  parseInclude() {
    const e = this.current();
    this.consume("At"), this.current();
    let t;
    return this.match("String") ? t = this.consume("String").value : t = this.consume("Identifier", "include path").value, this.includes.push(t), {
      type: "IncludeNode",
      path: t,
      line: e.line,
      column: e.column
    };
  }
  parseAssignment() {
    const e = this.current();
    this.pos++;
    let t;
    this.match("Dollar") ? t = this.consume("Dollar").value : t = this.consume("Identifier", "variable name").value, this.match("Equals") ? this.consume("Equals") : this.match("Colon") && this.consume("Colon");
    let i;
    if (this.match("Number"))
      i = parseFloat(this.consume("Number").value);
    else if (this.match("String"))
      i = this.consume("String").value;
    else if (this.match("Dollar")) {
      const n = this.consume("Dollar");
      i = this.variables.get(n.value) ?? `\${${n.value}}`;
    } else
      i = this.consume("Identifier", "value").value;
    return this.variables.set(t, i), {
      type: "AssignmentNode",
      name: t,
      value: i,
      line: e.line,
      column: e.column
    };
  }
  parseVarOrAssignment() {
    const e = this.current(), t = this.consume("Dollar").value;
    if (this.match("Equals") || this.match("Colon")) {
      this.pos++;
      let i;
      if (this.match("Number"))
        i = parseFloat(this.consume("Number").value);
      else if (this.match("String"))
        i = this.consume("String").value;
      else if (this.match("Dollar")) {
        const n = this.consume("Dollar");
        i = this.variables.get(n.value) ?? `\${${n.value}}`;
      } else
        i = this.consume("Identifier", "value").value;
      return this.variables.set(t, i), {
        type: "AssignmentNode",
        name: t,
        value: i,
        line: e.line,
        column: e.column
      };
    }
    return {
      type: "VarNode",
      name: t,
      line: e.line,
      column: e.column
    };
  }
  parseDelay() {
    const e = this.current();
    this.pos++, this.match("LParen") && this.consume("LParen");
    let t;
    if (this.match("Dollar")) {
      const n = this.consume("Dollar"), s = this.variables.get(n.value);
      s !== void 0 && typeof s == "number" ? t = s : s !== void 0 && typeof s == "string" ? t = parseFloat(s) : (t = 0, this.warnings.push({
        line: n.line,
        column: n.column,
        message: `Variable '${n.value}' not found, using default 0`
      }));
    } else
      t = parseFloat(this.consume("Number", "delay value").value);
    let i = "ms";
    if (this.match("Unit")) {
      const s = this.consume("Unit").value.toLowerCase();
      s === "s" || s === "sec" ? i = "s" : s === "min" ? (i = "s", t *= 60) : s === "h" && (i = "s", t *= 3600);
    }
    return this.match("RParen") && this.consume("RParen"), {
      type: "DelayNode",
      value: t,
      unit: i,
      line: e.line,
      column: e.column
    };
  }
  parseString() {
    const e = this.current();
    this.pos++, this.match("LParen") && this.consume("LParen");
    let t;
    if (this.match("String"))
      t = this.consume("String").value;
    else if (this.match("Dollar")) {
      const i = this.consume("Dollar"), n = this.variables.get(i.value);
      t = n !== void 0 ? String(n) : `\${${i.value}}`;
    } else
      t = this.consume("Identifier", "string value").value;
    return this.match("RParen") && this.consume("RParen"), {
      type: "StringNode",
      value: t,
      line: e.line,
      column: e.column
    };
  }
  parseStringLiteral() {
    const e = this.consume("String");
    return {
      type: "StringNode",
      value: e.value,
      line: e.line,
      column: e.column
    };
  }
  parseKey() {
    const e = this.current();
    this.pos++, this.match("LParen") && this.consume("LParen");
    const t = [];
    for (; this.match("Modifier"); ) {
      const n = this.consume("Modifier"), s = this.normalizeModifier(n.value.toLowerCase());
      t.includes(s) || t.push(s), this.match("Plus") ? this.consume("Plus") : this.match("Comma") ? this.consume("Comma") : this.match("Minus") && this.consume("Minus");
    }
    let i;
    if (this.match("Dollar")) {
      const n = this.consume("Dollar"), s = this.variables.get(n.value);
      i = s !== void 0 ? String(s) : `\${${n.value}}`;
    } else this.match("String") ? i = this.consume("String").value : i = this.consume("Identifier", "key name").value;
    return this.match("RParen") && this.consume("RParen"), {
      type: "KeyNode",
      key: i,
      modifiers: t,
      line: e.line,
      column: e.column
    };
  }
  normalizeModifier(e) {
    switch (e) {
      case "control":
        return "ctrl";
      case "option":
        return "alt";
      case "command":
      case "win":
      case "windows":
      case "super":
        return "cmd";
      case "meta":
        return "meta";
      default:
        return e;
    }
  }
  parseMouseMove() {
    const e = this.current();
    this.pos++, this.matchKeyword("move") && this.peek().type === "Keyword" && this.peek().value.toLowerCase() === "mouse" && this.pos++, this.match("LParen") && this.consume("LParen");
    let t = "current", i = "current", n = !1;
    if (this.matchKeyword("relative") ? (n = !0, this.pos++) : this.matchKeyword("absolute") && (n = !1, this.pos++), this.match("Number"))
      t = parseFloat(this.consume("Number").value);
    else if (this.matchKeyword("current"))
      this.pos++;
    else if (this.match("Dollar")) {
      const s = this.consume("Dollar"), r = this.variables.get(s.value);
      t = r !== void 0 ? Number(r) : 0;
    }
    if (this.match("Comma") && this.consume("Comma"), this.match("Number"))
      i = parseFloat(this.consume("Number").value);
    else if (this.matchKeyword("current"))
      this.pos++;
    else if (this.match("Dollar")) {
      const s = this.consume("Dollar"), r = this.variables.get(s.value);
      i = r !== void 0 ? Number(r) : 0;
    }
    return this.match("RParen") && this.consume("RParen"), {
      type: "MouseMoveNode",
      x: t,
      y: i,
      relative: n,
      line: e.line,
      column: e.column
    };
  }
  parseMouseClick() {
    const e = this.current(), t = this.current().value.toLowerCase();
    this.pos++, this.match("LParen") && this.consume("LParen");
    let i = "left", n = !1;
    return t === "rightclick" ? i = "right" : t === "middleclick" ? i = "middle" : t === "doubleclick" && (n = !0), this.matchKeyword("left") ? (i = "left", this.pos++) : this.matchKeyword("right") ? (i = "right", this.pos++) : this.matchKeyword("middle") && (i = "middle", this.pos++), this.matchKeyword("double") && (n = !0, this.pos++), this.match("RParen") && this.consume("RParen"), {
      type: "MouseClickNode",
      button: i,
      double: n,
      line: e.line,
      column: e.column
    };
  }
  parseRepeat() {
    const e = this.current();
    this.pos++, this.match("LParen") && this.consume("LParen");
    let t = "infinite";
    if (this.matchKeyword("infinite"))
      this.pos++;
    else if (this.match("Number"))
      t = parseInt(this.consume("Number").value, 10);
    else if (this.match("Dollar")) {
      const n = this.consume("Dollar"), s = this.variables.get(n.value);
      s !== void 0 && (t = Number(s));
    }
    this.match("RParen") && this.consume("RParen");
    const i = this.parseBlock("repeat", "end");
    return {
      type: "RepeatNode",
      count: t,
      body: i,
      line: e.line,
      column: e.column
    };
  }
  parseIfOS() {
    const e = this.current();
    this.pos++, this.match("LParen") && this.consume("LParen"), this.matchKeyword("os") && this.pos++;
    const t = [];
    do
      if (this.match("OS") || this.match("Identifier")) {
        const s = this.current(), r = this.normalizeOS(s.value.toLowerCase());
        r && !t.includes(r) && t.push(r), this.pos++;
      } else if (this.match("String")) {
        const s = this.consume("String"), r = this.normalizeOS(s.value.toLowerCase());
        r && !t.includes(r) && t.push(r);
      }
    while (this.match("Comma") || this.match("Or") || this.match("Plus") && (this.pos++, !0));
    this.match("Comma") && this.consume("Comma"), this.match("RParen") && this.consume("RParen");
    const i = [];
    let n = null;
    for (; !this.match("EOF"); ) {
      if (this.matchKeyword("else")) {
        this.pos++, n = this.parseBlock("else", "end");
        break;
      }
      if (this.matchKeyword("elif")) {
        this.pos++, n = [this.parseIfOS()];
        break;
      }
      if (this.matchKeyword("endif") || this.matchKeyword("end")) {
        this.pos++;
        break;
      }
      const s = this.parseStatement();
      s && i.push(s);
    }
    return {
      type: "IfOSNode",
      os: t,
      consequent: i,
      alternate: n,
      line: e.line,
      column: e.column
    };
  }
  normalizeOS(e) {
    switch (e) {
      case "windows":
      case "win":
        return "windows";
      case "mac":
      case "macos":
      case "darwin":
        return "mac";
      case "linux":
      case "unix":
        return "linux";
      default:
        return null;
    }
  }
  parseBlock(e, t) {
    const i = [];
    let n = 1;
    if (this.match("LBrace")) {
      for (this.consume("LBrace"); !this.match("EOF") && n > 0 && (this.match("LBrace") && (this.consume("LBrace"), n++), !(this.match("RBrace") && (this.consume("RBrace"), n--, n === 0))); )
        if (n > 0) {
          const s = this.parseStatement();
          s && i.push(s);
        }
    } else
      for (; !this.match("EOF"); ) {
        if (this.matchKeyword(t)) {
          this.pos++;
          break;
        }
        if (this.matchKeyword(e) && n++, n === 1 && (this.matchKeyword("else") || this.matchKeyword("elif")))
          break;
        const s = this.parseStatement();
        s && i.push(s);
      }
    return i;
  }
}
class Qt {
  constructor() {
    ue(this, "variables", /* @__PURE__ */ new Map());
  }
  generate(e) {
    return this.variables.clear(), {
      code: this.generateCode(e),
      fileName: this.fileName,
      fileExtension: this.fileExtension,
      targetDevice: this.targetDevice
    };
  }
  generateNode(e, t = 0) {
    switch (e.type) {
      case "delay":
        return this.generateDelay(e, t);
      case "string":
        return this.generateString(e, t);
      case "key":
        return this.generateKey(e, t);
      case "mouse_move":
        return this.generateMouseMove(e, t);
      case "mouse_click":
        return this.generateMouseClick(e, t);
      case "repeat":
        return this.generateRepeat(e, t);
      case "if_os":
        return this.generateIfOS(e, t);
      case "var":
        return this.generateVar(e, t);
      case "include":
        return this.generateInclude(e, t);
      default:
        return this.handleUnknownNode(e, t);
    }
  }
  handleUnknownNode(e, t) {
    return `${this.getIndent(t)}// Unknown node type: ${e.type}`;
  }
  getIndent(e) {
    return "  ".repeat(e);
  }
  escapeString(e) {
    return e.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
  }
  resolveVariables(e) {
    let t = e;
    for (const [i, n] of this.variables)
      t = t.replace(new RegExp(`\\$\\{${i}\\}`, "g"), n);
    return t;
  }
  generateNodes(e, t = 0) {
    return e.map((i) => this.generateNode(i, t)).filter((i) => i.trim().length > 0).join(`
`);
  }
  mapKeyName(e) {
    return {
      CTRL: "CTRL",
      CONTROL: "CTRL",
      SHIFT: "SHIFT",
      ALT: "ALT",
      GUI: "GUI",
      WINDOWS: "GUI",
      CMD: "GUI",
      COMMAND: "GUI",
      ENTER: "ENTER",
      RETURN: "ENTER",
      ESC: "ESC",
      ESCAPE: "ESC",
      BACKSPACE: "BACKSPACE",
      BS: "BACKSPACE",
      TAB: "TAB",
      SPACE: "SPACE",
      CAPSLOCK: "CAPSLOCK",
      DELETE: "DELETE",
      DEL: "DELETE",
      INSERT: "INSERT",
      INS: "INSERT",
      HOME: "HOME",
      END: "END",
      PAGEUP: "PAGEUP",
      PGUP: "PAGEUP",
      PAGEDOWN: "PAGEDOWN",
      PGDN: "PAGEDOWN",
      UP: "UP",
      UPARROW: "UP",
      DOWN: "DOWN",
      DOWNARROW: "DOWN",
      LEFT: "LEFT",
      LEFTARROW: "LEFT",
      RIGHT: "RIGHT",
      RIGHTARROW: "RIGHT",
      F1: "F1",
      F2: "F2",
      F3: "F3",
      F4: "F4",
      F5: "F5",
      F6: "F6",
      F7: "F7",
      F8: "F8",
      F9: "F9",
      F10: "F10",
      F11: "F11",
      F12: "F12",
      PRINTSCREEN: "PRINTSCREEN",
      SCROLLLOCK: "SCROLLLOCK",
      PAUSE: "PAUSE",
      BREAK: "PAUSE",
      MENU: "MENU",
      APP: "MENU"
    }[e.toUpperCase()] || e.toUpperCase();
  }
}
class pl extends Qt {
  constructor() {
    super(...arguments);
    ue(this, "targetDevice", "arduino");
    ue(this, "fileExtension", "ino");
    ue(this, "fileName", "payload");
  }
  generateCode(t) {
    return `#include <Keyboard.h>
#include <Mouse.h>

void setup() {
  Keyboard.begin();
  Mouse.begin();
  delay(1000);

${this.generateNodes(t, 1)}

  Keyboard.end();
  Mouse.end();
}

void loop() {
  // Empty loop
}

void typeString(String text) {
  for (unsigned int i = 0; i < text.length(); i++) {
    Keyboard.write(text.charAt(i));
    delay(5);
  }
}

void pressKey(uint8_t key, uint8_t modifiers) {
  if (modifiers > 0) {
    Keyboard.press(modifiers);
  }
  Keyboard.press(key);
  delay(50);
  Keyboard.release(key);
  if (modifiers > 0) {
    Keyboard.release(modifiers);
  }
  delay(50);
}
`;
  }
  generateDelay(t, i) {
    return `${this.getIndent(i)}delay(${t.milliseconds});`;
  }
  generateString(t, i) {
    const n = this.getIndent(i), s = this.resolveVariables(t.value), r = this.escapeString(s);
    return `${n}typeString("${r}");`;
  }
  generateKey(t, i) {
    const n = this.getIndent(i), s = this.mapKeyName(t.key), r = this.getModifiersMask(t.modifiers), c = this.getKeyCode(s), l = t.repeat || 1;
    if (l > 1) {
      const p = [];
      return p.push(`${n}for (int i = 0; i < ${l}; i++) {`), p.push(`${n}  pressKey(${c}, ${r});`), p.push(`${n}}`), p.join(`
`);
    }
    return `${n}pressKey(${c}, ${r});`;
  }
  generateMouseMove(t, i) {
    return `${this.getIndent(i)}Mouse.move(${t.x}, ${t.y}, 0);`;
  }
  generateMouseClick(t, i) {
    const n = this.getIndent(i), s = this.getMouseButton(t.button);
    return `${n}Mouse.click(${s});`;
  }
  generateRepeat(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i + 1), r = [];
    return r.push(`${n}for (int i = 0; i < ${t.count}; i++) {`), r.push(s), r.push(`${n}}`), r.join(`
`);
  }
  generateIfOS(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i + 1), r = [];
    return r.push(`${n}// Target OS: ${t.os}`), r.push(s), r.join(`
`);
  }
  generateVar(t, i) {
    return this.variables.set(t.name, t.value), "";
  }
  generateInclude(t, i) {
    return `${this.getIndent(i)}// Include template: ${t.template}`;
  }
  getModifiersMask(t) {
    const i = {
      CTRL: "KEY_LEFT_CTRL",
      CONTROL: "KEY_LEFT_CTRL",
      SHIFT: "KEY_LEFT_SHIFT",
      ALT: "KEY_LEFT_ALT",
      GUI: "KEY_LEFT_GUI",
      WINDOWS: "KEY_LEFT_GUI",
      CMD: "KEY_LEFT_GUI",
      COMMAND: "KEY_LEFT_GUI"
    }, n = t.map((s) => i[s.toUpperCase()] || "0");
    return n.length === 0 ? "0" : n.join(" | ");
  }
  getKeyCode(t) {
    return {
      ENTER: "KEY_RETURN",
      ESC: "KEY_ESC",
      BACKSPACE: "KEY_BACKSPACE",
      TAB: "KEY_TAB",
      SPACE: "' '",
      CAPSLOCK: "KEY_CAPS_LOCK",
      DELETE: "KEY_DELETE",
      INSERT: "KEY_INSERT",
      HOME: "KEY_HOME",
      END: "KEY_END",
      PAGEUP: "KEY_PAGE_UP",
      PAGEDOWN: "KEY_PAGE_DOWN",
      UP: "KEY_UP_ARROW",
      DOWN: "KEY_DOWN_ARROW",
      LEFT: "KEY_LEFT_ARROW",
      RIGHT: "KEY_RIGHT_ARROW",
      F1: "KEY_F1",
      F2: "KEY_F2",
      F3: "KEY_F3",
      F4: "KEY_F4",
      F5: "KEY_F5",
      F6: "KEY_F6",
      F7: "KEY_F7",
      F8: "KEY_F8",
      F9: "KEY_F9",
      F10: "KEY_F10",
      F11: "KEY_F11",
      F12: "KEY_F12",
      PRINTSCREEN: "KEY_PRINT_SCREEN",
      SCROLLLOCK: "KEY_SCROLL_LOCK",
      PAUSE: "KEY_PAUSE",
      MENU: "KEY_MENU"
    }[t] || `'${t.toLowerCase()}'`;
  }
  getMouseButton(t) {
    return {
      left: "MOUSE_LEFT",
      right: "MOUSE_RIGHT",
      middle: "MOUSE_MIDDLE"
    }[t] || "MOUSE_LEFT";
  }
}
class dl extends Qt {
  constructor() {
    super(...arguments);
    ue(this, "targetDevice", "pico");
    ue(this, "fileExtension", "c");
    ue(this, "fileName", "payload");
  }
  generateCode(t) {
    const i = this.generateNodes(t, 2);
    let n = "";
    return n += `#include <stdio.h>
`, n += `#include <stdlib.h>
`, n += `#include <string.h>
`, n += `#include "pico/stdlib.h"
`, n += `#include "pico/multicore.h"
`, n += `#include "hardware/gpio.h"
`, n += `#include "tusb.h"
`, n += `#include "class/hid/hid_device.h"
`, n += `
`, n += `#define USBD_VID     0x2E8A
`, n += `#define USBD_PID     0x000A
`, n += `#define USBD_MANUFACTURER "Raspberry Pi"
`, n += `#define USBD_PRODUCT "Pico HID"
`, n += `
`, n += `uint8_t const tud_desc_configuration[] = {
`, n += `  TUD_CONFIG_DESCRIPTOR(1, 1, 0, TUD_CONFIG_DESC_LEN + (TUD_HID_DESC_LEN * 2), TUSB_DESC_CONFIG_ATT_REMOTE_WAKEUP, 100),
`, n += `  TUD_HID_DESCRIPTOR(0, 0, false, HID_ITF_PROTOCOL_KEYBOARD, 8, HID_KEYBOARD_DESC_LEN, TUD_HID_REPORT_DESC_KEYBOARD()),
`, n += `  TUD_HID_DESCRIPTOR(1, 0, false, HID_ITF_PROTOCOL_MOUSE, 16, HID_MOUSE_DESC_LEN, TUD_HID_REPORT_DESC_MOUSE()),
`, n += `};
`, n += `
`, n += `char const *string_desc_arr[] = {
`, n += `  (const char[]) { 0x09, 0x04 },
`, n += `  USBD_MANUFACTURER,
`, n += `  USBD_PRODUCT,
`, n += `  "1234567890",
`, n += `};
`, n += `
`, n += `void type_string(const char *text) {
`, n += `  for (uint i = 0; i < strlen(text); i++) {
`, n += `    uint8_t keycode = 0;
`, n += `    char c = text[i];
`, n += `    if (c >= 'a' && c <= 'z') keycode = HID_KEY_A + (c - 'a');
`, n += `    else if (c >= 'A' && c <= 'Z') keycode = HID_KEY_A + (c - 'A');
`, n += `    else if (c >= '0' && c <= '9') keycode = HID_KEY_0 + (c - '0');
`, n += `    else if (c == ' ') keycode = HID_KEY_SPACE;
`, n += `    else if (c == '!') keycode = HID_KEY_1;
`, n += `    else if (c == '@') keycode = HID_KEY_2;
`, n += `    else if (c == '#') keycode = HID_KEY_3;
`, n += `    else if (c == '$') keycode = HID_KEY_4;
`, n += `    else if (c == '%') keycode = HID_KEY_5;
`, n += `    else if (c == '^') keycode = HID_KEY_6;
`, n += `    else if (c == '&') keycode = HID_KEY_7;
`, n += `    else if (c == '*') keycode = HID_KEY_8;
`, n += `    else if (c == '(') keycode = HID_KEY_9;
`, n += `    else if (c == ')') keycode = HID_KEY_0;
`, n += `    else if (c == '-') keycode = HID_KEY_MINUS;
`, n += `    else if (c == '_') keycode = HID_KEY_MINUS;
`, n += `    else if (c == '=') keycode = HID_KEY_EQUAL;
`, n += `    else if (c == '+') keycode = HID_KEY_EQUAL;
`, n += `    else if (c == '[') keycode = HID_KEY_BRACKET_LEFT;
`, n += `    else if (c == '{') keycode = HID_KEY_BRACKET_LEFT;
`, n += `    else if (c == ']') keycode = HID_KEY_BRACKET_RIGHT;
`, n += `    else if (c == '}') keycode = HID_KEY_BRACKET_RIGHT;
`, n += `    else if (c == '\\\\') keycode = HID_KEY_BACKSLASH;
`, n += `    else if (c == '|') keycode = HID_KEY_BACKSLASH;
`, n += `    else if (c == ';') keycode = HID_KEY_SEMICOLON;
`, n += `    else if (c == ':') keycode = HID_KEY_SEMICOLON;
`, n += `    else if (c == 39) keycode = HID_KEY_APOSTROPHE;
`, n += `    else if (c == '"') keycode = HID_KEY_APOSTROPHE;
`, n += `    else if (c == ',') keycode = HID_KEY_COMMA;
`, n += `    else if (c == '<') keycode = HID_KEY_COMMA;
`, n += `    else if (c == '.') keycode = HID_KEY_PERIOD;
`, n += `    else if (c == '>') keycode = HID_KEY_PERIOD;
`, n += `    else if (c == '/') keycode = HID_KEY_SLASH;
`, n += `    else if (c == '?') keycode = HID_KEY_SLASH;
`, n += `    else if (c == '~') keycode = HID_KEY_GRAVE;
`, n += "    else if (c == '`') keycode = HID_KEY_GRAVE;\n", n += `    else if (c == '\\n') keycode = HID_KEY_ENTER;
`, n += `    else if (c == '\\t') keycode = HID_KEY_TAB;
`, n += `    else if (c == '\\b') keycode = HID_KEY_BACKSPACE;
`, n += `
`, n += `    uint8_t modifier = 0;
`, n += `    if ((c >= 'A' && c <= 'Z') || c == '!' || c == '@' || c == '#' || c == '$' ||
`, n += `        c == '%' || c == '^' || c == '&' || c == '*' || c == '(' || c == ')' ||
`, n += `        c == '_' || c == '+' || c == '{' || c == '}' || c == '|' || c == ':' ||
`, n += `        c == '"' || c == '<' || c == '>' || c == '?' || c == '~') {
`, n += `      modifier = KEYBOARD_MODIFIER_LEFTSHIFT;
`, n += `    }
`, n += `
`, n += `    tud_hid_keyboard_report(0, modifier, &keycode);
`, n += `    sleep_ms(50);
`, n += `    tud_hid_keyboard_report(0, 0, NULL);
`, n += `    sleep_ms(5);
`, n += `  }
`, n += `}
`, n += `
`, n += `void press_key(uint8_t keycode, uint8_t modifiers, int repeat) {
`, n += `  for (int i = 0; i < repeat; i++) {
`, n += `    tud_hid_keyboard_report(0, modifiers, &keycode);
`, n += `    sleep_ms(50);
`, n += `    tud_hid_keyboard_report(0, 0, NULL);
`, n += `    sleep_ms(50);
`, n += `  }
`, n += `}
`, n += `
`, n += `void mouse_move(int8_t x, int8_t y) {
`, n += `  tud_hid_mouse_report(1, 0, x, y, 0, 0);
`, n += `  sleep_ms(10);
`, n += `}
`, n += `
`, n += `void mouse_click(uint8_t button) {
`, n += `  tud_hid_mouse_report(1, button, 0, 0, 0, 0);
`, n += `  sleep_ms(50);
`, n += `  tud_hid_mouse_report(1, 0, 0, 0, 0, 0);
`, n += `  sleep_ms(50);
`, n += `}
`, n += `
`, n += `void payload() {
`, n += `  sleep_ms(1000);
`, n += `
`, n += i + `
`, n += `}
`, n += `
`, n += `int main(void) {
`, n += `  stdio_init_all();
`, n += `  tusb_init();
`, n += `
`, n += `  while (!tud_mounted()) {
`, n += `    tud_task();
`, n += `    sleep_ms(10);
`, n += `  }
`, n += `
`, n += `  sleep_ms(500);
`, n += `  payload();
`, n += `
`, n += `  while (1) {
`, n += `    tud_task();
`, n += `    sleep_ms(10);
`, n += `  }
`, n += `
`, n += `  return 0;
`, n += `}
`, n += `
`, n += `uint16_t tud_hid_get_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t *buffer, uint16_t reqlen) {
`, n += `  return 0;
`, n += `}
`, n += `
`, n += `void tud_hid_set_report_cb(uint8_t instance, uint8_t report_id, hid_report_type_t report_type, uint8_t const *buffer, uint16_t bufsize) {
`, n += `}
`, n += `
`, n += `uint8_t const *tud_descriptor_device_cb(void) {
`, n += `  static tusb_desc_device_t const desc_device = {
`, n += `    .bLength            = sizeof(tusb_desc_device_t),
`, n += `    .bDescriptorType    = TUSB_DESC_DEVICE,
`, n += `    .bcdUSB             = 0x0200,
`, n += `    .bDeviceClass       = 0x00,
`, n += `    .bDeviceSubClass    = 0x00,
`, n += `    .bDeviceProtocol    = 0x00,
`, n += `    .bMaxPacketSize0    = CFG_TUD_ENDPOINT0_SIZE,
`, n += `    .idVendor           = USBD_VID,
`, n += `    .idProduct          = USBD_PID,
`, n += `    .bcdDevice          = 0x0100,
`, n += `    .iManufacturer      = 0x01,
`, n += `    .iProduct           = 0x02,
`, n += `    .iSerialNumber      = 0x03,
`, n += `    .bNumConfigurations = 0x01
`, n += `  };
`, n += `  return (uint8_t const *)&desc_device;
`, n += `}
`, n += `
`, n += `uint8_t const *tud_descriptor_configuration_cb(uint8_t index) {
`, n += `  return tud_desc_configuration;
`, n += `}
`, n += `
`, n += `uint16_t const *tud_descriptor_string_cb(uint8_t index, uint16_t langid) {
`, n += `  static uint16_t _desc_str[32];
`, n += `  uint8_t chr_count;
`, n += `
`, n += `  if (index == 0) {
`, n += `    memcpy(&_desc_str[1], string_desc_arr[0], 2);
`, n += `    chr_count = 1;
`, n += `  } else {
`, n += `    if (!(index < sizeof(string_desc_arr) / sizeof(string_desc_arr[0]))) return NULL;
`, n += `    const char *str = string_desc_arr[index];
`, n += `    chr_count = strlen(str);
`, n += `    if (chr_count > 31) chr_count = 31;
`, n += `    for (uint8_t i = 0; i < chr_count; i++) {
`, n += `      _desc_str[1 + i] = str[i];
`, n += `    }
`, n += `  }
`, n += `
`, n += `  _desc_str[0] = (TUSB_DESC_STRING << 8) | (2 * chr_count + 2);
`, n += `  return _desc_str;
`, n += `}
`, n;
  }
  generateDelay(t, i) {
    return `${this.getIndent(i)}sleep_ms(${t.milliseconds});`;
  }
  generateString(t, i) {
    const n = this.getIndent(i), s = this.resolveVariables(t.value), r = this.escapeString(s);
    return `${n}type_string("${r}");`;
  }
  generateKey(t, i) {
    const n = this.getIndent(i), s = this.mapKeyName(t.key), r = this.getModifiersMask(t.modifiers), c = this.getKeyCode(s), l = t.repeat || 1;
    return `${n}press_key(${c}, ${r}, ${l});`;
  }
  generateMouseMove(t, i) {
    return `${this.getIndent(i)}mouse_move(${t.x}, ${t.y});`;
  }
  generateMouseClick(t, i) {
    const n = this.getIndent(i), s = this.getMouseButton(t.button);
    return `${n}mouse_click(${s});`;
  }
  generateRepeat(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i + 1), r = [];
    return r.push(`${n}for (int i = 0; i < ${t.count}; i++) {`), r.push(s), r.push(`${n}}`), r.join(`
`);
  }
  generateIfOS(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i + 1), r = [];
    return r.push(`${n}// Target OS: ${t.os}`), r.push(s), r.join(`
`);
  }
  generateVar(t, i) {
    return this.variables.set(t.name, t.value), "";
  }
  generateInclude(t, i) {
    return `${this.getIndent(i)}// Include template: ${t.template}`;
  }
  getModifiersMask(t) {
    const i = {
      CTRL: "KEYBOARD_MODIFIER_LEFTCTRL",
      CONTROL: "KEYBOARD_MODIFIER_LEFTCTRL",
      SHIFT: "KEYBOARD_MODIFIER_LEFTSHIFT",
      ALT: "KEYBOARD_MODIFIER_LEFTALT",
      GUI: "KEYBOARD_MODIFIER_LEFTGUI",
      WINDOWS: "KEYBOARD_MODIFIER_LEFTGUI",
      CMD: "KEYBOARD_MODIFIER_LEFTGUI",
      COMMAND: "KEYBOARD_MODIFIER_LEFTGUI"
    }, n = t.map((s) => i[s.toUpperCase()] || "0");
    return n.length === 0 ? "0" : n.join(" | ");
  }
  getKeyCode(t) {
    return {
      ENTER: "HID_KEY_ENTER",
      ESC: "HID_KEY_ESCAPE",
      BACKSPACE: "HID_KEY_BACKSPACE",
      TAB: "HID_KEY_TAB",
      SPACE: "HID_KEY_SPACE",
      CAPSLOCK: "HID_KEY_CAPS_LOCK",
      DELETE: "HID_KEY_DELETE",
      INSERT: "HID_KEY_INSERT",
      HOME: "HID_KEY_HOME",
      END: "HID_KEY_END",
      PAGEUP: "HID_KEY_PAGE_UP",
      PAGEDOWN: "HID_KEY_PAGE_DOWN",
      UP: "HID_KEY_ARROW_UP",
      DOWN: "HID_KEY_ARROW_DOWN",
      LEFT: "HID_KEY_ARROW_LEFT",
      RIGHT: "HID_KEY_ARROW_RIGHT",
      F1: "HID_KEY_F1",
      F2: "HID_KEY_F2",
      F3: "HID_KEY_F3",
      F4: "HID_KEY_F4",
      F5: "HID_KEY_F5",
      F6: "HID_KEY_F6",
      F7: "HID_KEY_F7",
      F8: "HID_KEY_F8",
      F9: "HID_KEY_F9",
      F10: "HID_KEY_F10",
      F11: "HID_KEY_F11",
      F12: "HID_KEY_F12",
      PRINTSCREEN: "HID_KEY_PRINT_SCREEN",
      SCROLLLOCK: "HID_KEY_SCROLL_LOCK",
      PAUSE: "HID_KEY_PAUSE",
      MENU: "HID_KEY_APPLICATION"
    }[t] || `HID_KEY_${t.toUpperCase()}`;
  }
  getMouseButton(t) {
    return {
      left: "MOUSE_BUTTON_LEFT",
      right: "MOUSE_BUTTON_RIGHT",
      middle: "MOUSE_BUTTON_MIDDLE"
    }[t] || "MOUSE_BUTTON_LEFT";
  }
}
class ml extends Qt {
  constructor() {
    super(...arguments);
    ue(this, "targetDevice", "badusb");
    ue(this, "fileExtension", "txt");
    ue(this, "fileName", "payload");
  }
  generateCode(t) {
    const i = [];
    i.push("REM Generated by HID Attack Framework"), i.push("REM Target: BadUSB / Rubber Ducky"), i.push("");
    const n = this.generateNodes(t, 0);
    return n && i.push(n), i.join(`
`);
  }
  generateDelay(t, i) {
    return `${this.getIndent(i)}DELAY ${t.milliseconds}`;
  }
  generateString(t, i) {
    const n = this.getIndent(i), s = this.resolveVariables(t.value);
    if (s.includes(`
`)) {
      const r = [], c = s.split(`
`);
      return c.forEach((l, p) => {
        l.length > 0 && r.push(`${n}STRING ${l}`), p < c.length - 1 && r.push(`${n}ENTER`);
      }), r.join(`
`);
    }
    return `${n}STRING ${s}`;
  }
  generateKey(t, i) {
    const n = this.getIndent(i), s = this.mapKeyName(t.key), r = t.modifiers.map((m) => this.mapModifier(m)).filter(Boolean), c = t.repeat || 1, p = [...r, s].join(" ");
    if (c > 1) {
      const m = [];
      for (let u = 0; u < c; u++)
        m.push(`${n}${p}`);
      return m.join(`
`);
    }
    return `${n}${p}`;
  }
  generateMouseMove(t, i) {
    return `${this.getIndent(i)}REM MOUSE_MOVE ${t.x} ${t.y}`;
  }
  generateMouseClick(t, i) {
    const n = this.getIndent(i), r = {
      left: "LEFTCLICK",
      right: "RIGHTCLICK",
      middle: "MIDDLECLICK"
    }[t.button] || "LEFTCLICK";
    return `${n}${r}`;
  }
  generateRepeat(t, i) {
    const n = this.getIndent(i), s = [], r = this.generateNodes(t.body, i);
    s.push(`${n}REM REPEAT ${t.count}`);
    for (let c = 0; c < t.count; c++)
      r && s.push(r);
    return s.push(`${n}REM END_REPEAT`), s.join(`
`);
  }
  generateIfOS(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i), r = [];
    return r.push(`${n}REM Target OS: ${t.os}`), s && r.push(s), r.join(`
`);
  }
  generateVar(t, i) {
    return this.variables.set(t.name, t.value), `${this.getIndent(i)}REM VAR ${t.name} = ${t.value}`;
  }
  generateInclude(t, i) {
    return `${this.getIndent(i)}REM INCLUDE ${t.template}`;
  }
  mapModifier(t) {
    return {
      CTRL: "CONTROL",
      CONTROL: "CONTROL",
      SHIFT: "SHIFT",
      ALT: "ALT",
      GUI: "GUI",
      WINDOWS: "GUI",
      CMD: "GUI",
      COMMAND: "GUI"
    }[t.toUpperCase()] || "";
  }
  mapKeyName(t) {
    return {
      CTRL: "CONTROL",
      CONTROL: "CONTROL",
      SHIFT: "SHIFT",
      ALT: "ALT",
      GUI: "GUI",
      WINDOWS: "GUI",
      CMD: "GUI",
      COMMAND: "GUI",
      ENTER: "ENTER",
      RETURN: "ENTER",
      ESC: "ESC",
      ESCAPE: "ESC",
      BACKSPACE: "BACKSPACE",
      BS: "BACKSPACE",
      TAB: "TAB",
      SPACE: "SPACE",
      CAPSLOCK: "CAPSLOCK",
      DELETE: "DELETE",
      DEL: "DELETE",
      INSERT: "INSERT",
      INS: "INSERT",
      HOME: "HOME",
      END: "END",
      PAGEUP: "PAGEUP",
      PGUP: "PAGEUP",
      PAGEDOWN: "PAGEDOWN",
      PGDN: "PAGEDOWN",
      UP: "UP",
      UPARROW: "UP",
      DOWN: "DOWN",
      DOWNARROW: "DOWN",
      LEFT: "LEFT",
      LEFTARROW: "LEFT",
      RIGHT: "RIGHT",
      RIGHTARROW: "RIGHT",
      F1: "F1",
      F2: "F2",
      F3: "F3",
      F4: "F4",
      F5: "F5",
      F6: "F6",
      F7: "F7",
      F8: "F8",
      F9: "F9",
      F10: "F10",
      F11: "F11",
      F12: "F12",
      PRINTSCREEN: "PRINTSCREEN",
      SCROLLLOCK: "SCROLLLOCK",
      PAUSE: "PAUSE",
      BREAK: "PAUSE",
      MENU: "MENU",
      APP: "MENU"
    }[t.toUpperCase()] || t.toUpperCase();
  }
}
class fl extends Qt {
  constructor() {
    super(...arguments);
    ue(this, "targetDevice", "flipper");
    ue(this, "fileExtension", "txt");
    ue(this, "fileName", "payload");
  }
  generateCode(t) {
    const i = [];
    i.push("REM Generated by HID Attack Framework"), i.push("REM Target: Flipper Zero BadUSB"), i.push("ID: HID Attack Framework Payload"), i.push("VERSION: 1.0"), i.push("");
    const n = this.generateNodes(t, 0);
    return n && i.push(n), i.join(`
`);
  }
  generateDelay(t, i) {
    const n = this.getIndent(i);
    if (t.milliseconds >= 1e3) {
      const s = Math.floor(t.milliseconds / 1e3);
      return `${n}DELAY ${s}`;
    }
    return `${n}DELAY ${t.milliseconds}`;
  }
  generateString(t, i) {
    const n = this.getIndent(i), s = this.resolveVariables(t.value);
    if (s.includes(`
`)) {
      const r = [], c = s.split(`
`);
      return c.forEach((l, p) => {
        l.length > 0 && r.push(`${n}STRING ${l}`), p < c.length - 1 && r.push(`${n}ENTER`);
      }), r.join(`
`);
    }
    return `${n}STRING ${s}`;
  }
  generateKey(t, i) {
    const n = this.getIndent(i), s = this.mapKeyName(t.key), r = t.modifiers.map((m) => this.mapModifier(m)).filter(Boolean), c = t.repeat || 1, p = [...r, s].join("-");
    if (c > 1) {
      const m = [];
      for (let u = 0; u < c; u++)
        m.push(`${n}${p}`);
      return m.join(`
`);
    }
    return `${n}${p}`;
  }
  generateMouseMove(t, i) {
    return `${this.getIndent(i)}MOUSE_MOVE ${t.x} ${t.y}`;
  }
  generateMouseClick(t, i) {
    const n = this.getIndent(i), r = {
      left: "MOUSE_LEFT",
      right: "MOUSE_RIGHT",
      middle: "MOUSE_MIDDLE"
    }[t.button] || "MOUSE_LEFT";
    return `${n}${r}`;
  }
  generateRepeat(t, i) {
    const n = this.getIndent(i), s = [], r = this.generateNodes(t.body, i);
    return s.push(`${n}REPEAT ${t.count}`), r && s.push(r), s.push(`${n}END_REPEAT`), s.join(`
`);
  }
  generateIfOS(t, i) {
    const n = this.getIndent(i), s = this.generateNodes(t.body, i), r = [];
    return r.push(`${n}REM Target OS: ${t.os}`), s && r.push(s), r.join(`
`);
  }
  generateVar(t, i) {
    return this.variables.set(t.name, t.value), `${this.getIndent(i)}REM VAR ${t.name} = ${t.value}`;
  }
  generateInclude(t, i) {
    return `${this.getIndent(i)}REM INCLUDE ${t.template}`;
  }
  mapModifier(t) {
    return {
      CTRL: "CTRL",
      CONTROL: "CTRL",
      SHIFT: "SHIFT",
      ALT: "ALT",
      GUI: "GUI",
      WINDOWS: "GUI",
      CMD: "GUI",
      COMMAND: "GUI"
    }[t.toUpperCase()] || "";
  }
  mapKeyName(t) {
    return {
      CTRL: "CTRL",
      CONTROL: "CTRL",
      SHIFT: "SHIFT",
      ALT: "ALT",
      GUI: "GUI",
      WINDOWS: "GUI",
      CMD: "GUI",
      COMMAND: "GUI",
      ENTER: "ENTER",
      RETURN: "ENTER",
      ESC: "ESC",
      ESCAPE: "ESC",
      BACKSPACE: "BACKSPACE",
      BS: "BACKSPACE",
      TAB: "TAB",
      SPACE: "SPACE",
      CAPSLOCK: "CAPSLOCK",
      DELETE: "DELETE",
      DEL: "DELETE",
      INSERT: "INSERT",
      INS: "INSERT",
      HOME: "HOME",
      END: "END",
      PAGEUP: "PAGEUP",
      PGUP: "PAGEUP",
      PAGEDOWN: "PAGEDOWN",
      PGDN: "PAGEDOWN",
      UP: "UP",
      UPARROW: "UP",
      DOWN: "DOWN",
      DOWNARROW: "DOWN",
      LEFT: "LEFT",
      LEFTARROW: "LEFT",
      RIGHT: "RIGHT",
      RIGHTARROW: "RIGHT",
      F1: "F1",
      F2: "F2",
      F3: "F3",
      F4: "F4",
      F5: "F5",
      F6: "F6",
      F7: "F7",
      F8: "F8",
      F9: "F9",
      F10: "F10",
      F11: "F11",
      F12: "F12",
      PRINTSCREEN: "PRINTSCREEN",
      SCROLLLOCK: "SCROLLLOCK",
      PAUSE: "PAUSE",
      BREAK: "PAUSE",
      MENU: "MENU",
      APP: "MENU"
    }[t.toUpperCase()] || t.toUpperCase();
  }
}
const hl = {
  minTypingSpeedThreshold: 800,
  shortcutDensityThreshold: 5,
  shortcutTimeWindowMs: 2e3,
  minInputIntervalVariance: 10,
  mouseEdgeDetection: !0,
  screenWidth: 1920,
  screenHeight: 1080,
  edgeThreshold: 50
}, or = [
  { pattern: ["MetaLeft", "r"], name: "Windows Run dialog", severity: "medium" },
  { pattern: ["ControlLeft", "ShiftLeft", "Escape"], name: "Task Manager", severity: "medium" },
  { pattern: ["MetaLeft", "x"], name: "Power User Menu", severity: "low" },
  { pattern: ["MetaLeft", "i"], name: "Settings", severity: "low" },
  { pattern: ["ControlLeft", "AltLeft", "Delete"], name: "Secure Attention Sequence", severity: "high" },
  { pattern: ["MetaLeft", " "], name: "Cortana/Search", severity: "low" }
];
class vl {
  constructor(e) {
    ue(this, "config");
    ue(this, "eventBuffer", []);
    ue(this, "maxBufferSize", 1e3);
    ue(this, "lastAlertTime", /* @__PURE__ */ new Map());
    ue(this, "alertCooldownMs", 5e3);
    this.config = { ...hl, ...e };
  }
  updateConfig(e) {
    this.config = { ...this.config, ...e };
  }
  processEvent(e) {
    this.addEvent(e);
    const t = this.calculateMetrics();
    return { alerts: this.detectAnomalies(e, t), metrics: t };
  }
  processEvents(e) {
    for (const n of e)
      this.addEvent(n);
    const t = this.calculateMetrics(), i = [];
    for (const n of e) {
      const s = this.detectAnomalies(n, t);
      i.push(...s);
    }
    return { alerts: i, metrics: t };
  }
  addEvent(e) {
    this.eventBuffer.push(e), this.eventBuffer.length > this.maxBufferSize && this.eventBuffer.shift();
  }
  calculateMetrics() {
    const e = this.getRecentEvents(5e3), t = e.filter((i) => i.type === "keyboard" && i.keyCode);
    return {
      typingSpeed: this.calculateTypingSpeed(t),
      shortcutDensity: this.calculateShortcutDensity(t),
      inputIntervalVariance: this.calculateInputIntervalVariance(e),
      averageInterval: this.calculateAverageInterval(e),
      mouseEdgeCrossings: this.calculateMouseEdgeCrossings(e),
      patternMatches: this.matchSequencePatterns(t)
    };
  }
  getRecentEvents(e) {
    const t = Date.now();
    return this.eventBuffer.filter((i) => {
      const n = i.timestamp instanceof Date ? i.timestamp.getTime() : new Date(i.timestamp).getTime();
      return t - n <= e;
    });
  }
  calculateTypingSpeed(e) {
    if (e.length < 2) return 0;
    const t = e.filter((r) => r.keyCode && !r.isModifier);
    if (t.length < 2) return 0;
    const i = t[0].timestamp instanceof Date ? t[0].timestamp.getTime() : new Date(t[0].timestamp).getTime(), s = ((t[t.length - 1].timestamp instanceof Date ? t[t.length - 1].timestamp.getTime() : new Date(t[t.length - 1].timestamp).getTime()) - i) / 1e3;
    return s <= 0 ? 0 : Math.round(t.length / s * 60);
  }
  calculateShortcutDensity(e) {
    if (e.length < 2) return 0;
    const t = this.config.shortcutTimeWindowMs;
    let i = 0, n = 0;
    for (let s = 0; s < e.length; s++) {
      const r = e[s].timestamp instanceof Date ? e[s].timestamp.getTime() : new Date(e[s].timestamp).getTime();
      for (; n <= s; ) {
        const p = e[n].timestamp instanceof Date ? e[n].timestamp.getTime() : new Date(e[n].timestamp).getTime();
        if (r - p <= t) break;
        n++;
      }
      const l = e.slice(n, s + 1).filter((p) => p.isModifier && p.modifiers && p.modifiers.length > 0).length;
      i = Math.max(i, l);
    }
    return i;
  }
  calculateInputIntervalVariance(e) {
    if (e.length < 3) return 0;
    const t = [];
    for (let r = 1; r < e.length; r++) {
      const c = e[r - 1].timestamp instanceof Date ? e[r - 1].timestamp.getTime() : new Date(e[r - 1].timestamp).getTime(), l = e[r].timestamp instanceof Date ? e[r].timestamp.getTime() : new Date(e[r].timestamp).getTime();
      t.push(l - c);
    }
    if (t.length < 2) return 0;
    const i = t.reduce((r, c) => r + c, 0) / t.length, n = t.map((r) => Math.pow(r - i, 2)), s = n.reduce((r, c) => r + c, 0) / n.length;
    return Math.round(s);
  }
  calculateAverageInterval(e) {
    if (e.length < 2) return 0;
    let t = 0;
    for (let i = 1; i < e.length; i++) {
      const n = e[i - 1].timestamp instanceof Date ? e[i - 1].timestamp.getTime() : new Date(e[i - 1].timestamp).getTime(), s = e[i].timestamp instanceof Date ? e[i].timestamp.getTime() : new Date(e[i].timestamp).getTime();
      t += s - n;
    }
    return Math.round(t / (e.length - 1));
  }
  calculateMouseEdgeCrossings(e) {
    if (!this.config.mouseEdgeDetection) return 0;
    const t = e.filter((c) => c.type === "mouse");
    if (t.length < 2) return 0;
    let i = 0, n = this.config.screenWidth / 2, s = this.config.screenHeight / 2;
    const r = this.config.edgeThreshold;
    for (const c of t)
      c.mouseX !== void 0 && (n += c.mouseX), c.mouseY !== void 0 && (s += c.mouseY), n = Math.max(0, Math.min(this.config.screenWidth, n)), s = Math.max(0, Math.min(this.config.screenHeight, s)), (n <= r || n >= this.config.screenWidth - r || s <= r || s >= this.config.screenHeight - r) && i++;
    return i;
  }
  matchSequencePatterns(e) {
    const t = [];
    if (e.length < 2) return t;
    const i = e.filter((n) => n.keyName).map((n) => n.modifiers && n.modifiers.length > 0 ? [...n.modifiers, n.keyName] : [n.keyName]).flat();
    for (const n of or)
      this.isSubsequence(i, n.pattern) && t.push(n.name);
    return t;
  }
  isSubsequence(e, t) {
    if (t.length > e.length) return !1;
    let i = 0;
    for (let n = 0; n < e.length && i < t.length; n++)
      e[n] === t[i] && i++;
    return i === t.length;
  }
  detectAnomalies(e, t) {
    const i = [], n = [];
    let s = "low", r = 0;
    const c = [];
    t.typingSpeed > this.config.minTypingSpeedThreshold && (n.push(`异常输入速度: ${t.typingSpeed} CPM (阈值: ${this.config.minTypingSpeedThreshold})`), s = this.escalateSeverity(s, "medium"), r += 30, c.push("statistical:high_typing_speed")), t.shortcutDensity >= this.config.shortcutDensityThreshold && (n.push(`快捷键密度过高: ${t.shortcutDensity} (阈值: ${this.config.shortcutDensityThreshold})`), s = this.escalateSeverity(s, "medium"), r += 25, c.push("statistical:high_shortcut_density")), t.inputIntervalVariance < this.config.minInputIntervalVariance && t.averageInterval > 0 && (n.push(`输入间隔方差异常: ${t.inputIntervalVariance}ms² (阈值: ${this.config.minInputIntervalVariance}ms²)`), s = this.escalateSeverity(s, "high"), r += 35, c.push("statistical:low_interval_variance")), t.mouseEdgeCrossings > 10 && (n.push(`鼠标边缘检测异常: ${t.mouseEdgeCrossings} 次边缘移动`), s = this.escalateSeverity(s, "medium"), r += 20, c.push("mouse:edge_movement"));
    for (const l of t.patternMatches) {
      const p = or.find((m) => m.name === l);
      n.push(`可疑序列模式匹配: ${l}`), s = this.escalateSeverity(s, (p == null ? void 0 : p.severity) || "medium"), r += 15, c.push(`sequence:${l}`);
    }
    if (n.length > 0) {
      const l = `${e.devicePath}:${c.join(",")}`, p = Date.now(), m = this.lastAlertTime.get(l) || 0;
      if (p - m >= this.alertCooldownMs) {
        this.lastAlertTime.set(l, p);
        const u = this.createAlert(e, n, s, r, c);
        i.push(u);
      }
    }
    return i;
  }
  escalateSeverity(e, t) {
    const i = ["low", "medium", "high", "critical"], n = i.indexOf(e), s = i.indexOf(t);
    return i[Math.max(n, s)];
  }
  createAlert(e, t, i, n, s) {
    const r = this.generateSequenceHash(this.eventBuffer.slice(-20));
    return {
      id: We.randomUUID(),
      timestamp: /* @__PURE__ */ new Date(),
      device: e.device || this.createUnknownDevice(e.devicePath),
      severity: i,
      reason: t.join("; "),
      matchedSignatures: s,
      inputSequence: this.eventBuffer.slice(-20),
      riskScore: Math.min(100, n),
      inputSequenceHash: r,
      isReviewed: !1
    };
  }
  createUnknownDevice(e) {
    return {
      vendorId: 0,
      productId: 0,
      manufacturer: "Unknown",
      productName: "Unknown HID Device",
      serialNumber: "",
      devicePath: e,
      firstSeen: /* @__PURE__ */ new Date()
    };
  }
  generateSequenceHash(e) {
    const t = e.filter((i) => i.keyCode).map((i) => {
      var n;
      return `${i.keyCode}:${((n = i.modifiers) == null ? void 0 : n.join("+")) || ""}`;
    }).join("|");
    return We.createHash("sha256").update(t).digest("hex");
  }
  clearBuffer() {
    this.eventBuffer = [], this.lastAlertTime.clear();
  }
  getBufferSize() {
    return this.eventBuffer.length;
  }
}
const xl = 1, gl = 6, yl = 1, bl = 2, _l = {
  224: "ControlLeft",
  225: "ShiftLeft",
  226: "AltLeft",
  227: "MetaLeft",
  228: "ControlRight",
  229: "ShiftRight",
  230: "AltRight",
  231: "MetaRight"
}, wl = {
  4: "a",
  5: "b",
  6: "c",
  7: "d",
  8: "e",
  9: "f",
  10: "g",
  11: "h",
  12: "i",
  13: "j",
  14: "k",
  15: "l",
  16: "m",
  17: "n",
  18: "o",
  19: "p",
  20: "q",
  21: "r",
  22: "s",
  23: "t",
  24: "u",
  25: "v",
  26: "w",
  27: "x",
  28: "y",
  29: "z",
  30: "1",
  31: "2",
  32: "3",
  33: "4",
  34: "5",
  35: "6",
  36: "7",
  37: "8",
  38: "9",
  39: "0",
  40: "Enter",
  41: "Escape",
  42: "Backspace",
  43: "Tab",
  44: " ",
  45: "-",
  46: "=",
  47: "[",
  48: "]",
  49: "\\",
  51: ";",
  52: "'",
  54: ",",
  55: ".",
  56: "/",
  57: "CapsLock",
  58: "F1",
  59: "F2",
  60: "F3",
  61: "F4",
  62: "F5",
  63: "F6",
  64: "F7",
  65: "F8",
  66: "F9",
  67: "F10",
  68: "F11",
  69: "F12",
  79: "ArrowRight",
  80: "ArrowLeft",
  81: "ArrowDown",
  82: "ArrowUp"
};
class El extends Js {
  constructor() {
    super();
    ue(this, "openedDevices", /* @__PURE__ */ new Map());
    ue(this, "isListening", !1);
    ue(this, "screenWidth", 1920);
    ue(this, "screenHeight", 1080);
    this.setMaxListeners(100);
  }
  setScreenSize(t, i) {
    this.screenWidth = t, this.screenHeight = i;
  }
  enumerateDevices() {
    return Ot.devices().map((i) => this.mapToHIDDevice(i));
  }
  startListening() {
    this.isListening || (this.isListening = !0, this.enumerateAndOpenDevices(), Dt.on("attach", (t) => {
      this.handleDeviceAttach(t);
    }), Dt.on("detach", (t) => {
      this.handleDeviceDetach(t);
    }), this.emit("listening-started"));
  }
  stopListening() {
    if (this.isListening) {
      this.isListening = !1;
      for (const [t, i] of this.openedDevices)
        try {
          i.device.close();
        } catch {
        }
      this.openedDevices.clear(), Dt.removeAllListeners("attach"), Dt.removeAllListeners("detach"), this.emit("listening-stopped");
    }
  }
  enumerateAndOpenDevices() {
    const t = Ot.devices();
    for (const i of t)
      i.path && !this.openedDevices.has(i.path) && this.openDevice(i);
  }
  openDevice(t) {
    if (t.path)
      try {
        const i = new Ot.HID(t.path), n = this.getDeviceType(t);
        i.on("data", (s) => {
          this.handleInputData(t, n, s);
        }), i.on("error", (s) => {
          this.emit("device-error", { devicePath: t.path, error: s });
        }), this.openedDevices.set(t.path, { device: i, info: t, deviceType: n }), this.emit("device-opened", this.mapToHIDDevice(t));
      } catch (i) {
        this.emit("device-open-failed", {
          devicePath: t.path,
          vendorId: t.vendorId,
          productId: t.productId,
          error: i
        });
      }
  }
  handleDeviceAttach(t) {
    const i = t.deviceDescriptor;
    setTimeout(() => {
      const s = Ot.devices().find(
        (r) => r.vendorId === i.idVendor && r.productId === i.idProduct
      );
      s && s.path && (this.openDevice(s), this.emit("device-attached", this.mapToHIDDevice(s)));
    }, 500);
  }
  handleDeviceDetach(t) {
    const i = t.deviceDescriptor;
    for (const [n, s] of this.openedDevices)
      if (s.info.vendorId === i.idVendor && s.info.productId === i.idProduct) {
        try {
          s.device.close();
        } catch {
        }
        this.openedDevices.delete(n), this.emit("device-detached", this.mapToHIDDevice(s.info));
        break;
      }
  }
  getDeviceType(t) {
    const { usagePage: i, usage: n } = t;
    if (i === xl && n === gl)
      return "keyboard";
    if (i === yl && n === bl)
      return "mouse";
    const s = (t.product || "").toLowerCase();
    return s.includes("keyboard") ? "keyboard" : s.includes("mouse") ? "mouse" : "other";
  }
  handleInputData(t, i, n) {
    const s = process.hrtime.bigint(), r = Array.from(n), c = {
      id: We.randomUUID(),
      timestamp: /* @__PURE__ */ new Date(),
      devicePath: t.path || "",
      device: this.mapToHIDDevice(t),
      type: i,
      rawData: r
    };
    i === "keyboard" ? this.parseKeyboardReport(n, c) : i === "mouse" && this.parseMouseReport(n, c);
    const l = process.hrtime.bigint();
    c.processingTimeMs = Number(l - s) / 1e6, this.emit("input-event", c);
  }
  parseKeyboardReport(t, i) {
    if (t.length < 3) return;
    const n = t[0], s = [];
    for (let r = 0; r < 8; r++)
      if (n & 1 << r) {
        const c = _l[224 + r];
        c && s.push(c);
      }
    i.modifiers = s, i.isModifier = s.length > 0;
    for (let r = 2; r < Math.min(t.length, 8); r++) {
      const c = t[r];
      if (c !== 0) {
        i.keyCode = c, i.keyName = wl[c] || `Unknown(0x${c.toString(16)})`;
        break;
      }
    }
  }
  parseMouseReport(t, i) {
    if (t.length < 4) return;
    const n = t[0];
    let s = t[1], r = t[2];
    const c = t.length > 3 ? t[3] : 0;
    s & 128 && (s = s - 256), r & 128 && (r = r - 256), i.mouseX = s, i.mouseY = r, n & 1 ? i.keyName = "MouseLeft" : n & 2 ? i.keyName = "MouseRight" : n & 4 ? i.keyName = "MouseMiddle" : c !== 0 && (i.keyName = "MouseWheel"), i.keyCode = n;
  }
  mapToHIDDevice(t) {
    return {
      vendorId: t.vendorId,
      productId: t.productId,
      manufacturer: t.manufacturer || "",
      productName: t.product || "",
      serialNumber: t.serialNumber || "",
      devicePath: t.path || "",
      firstSeen: /* @__PURE__ */ new Date()
    };
  }
  isRunning() {
    return this.isListening;
  }
  getOpenedDeviceCount() {
    return this.openedDevices.size;
  }
}
function _o(a, e) {
  return function() {
    return a.apply(e, arguments);
  };
}
const { toString: Sl } = Object.prototype, { getPrototypeOf: Zt } = Object, { iterator: en, toStringTag: wo } = Symbol, tn = /* @__PURE__ */ ((a) => (e) => {
  const t = Sl.call(e);
  return a[t] || (a[t] = t.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null)), Be = (a) => (a = a.toLowerCase(), (e) => tn(e) === a), nn = (a) => (e) => typeof e === a, { isArray: pt } = Array, ct = nn("undefined");
function St(a) {
  return a !== null && !ct(a) && a.constructor !== null && !ct(a.constructor) && Ne(a.constructor.isBuffer) && a.constructor.isBuffer(a);
}
const Eo = Be("ArrayBuffer");
function Rl(a) {
  let e;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? e = ArrayBuffer.isView(a) : e = a && a.buffer && Eo(a.buffer), e;
}
const kl = nn("string"), Ne = nn("function"), So = nn("number"), Rt = (a) => a !== null && typeof a == "object", Tl = (a) => a === !0 || a === !1, Kt = (a) => {
  if (tn(a) !== "object")
    return !1;
  const e = Zt(a);
  return (e === null || e === Object.prototype || Object.getPrototypeOf(e) === null) && !(wo in a) && !(en in a);
}, Al = (a) => {
  if (!Rt(a) || St(a))
    return !1;
  try {
    return Object.keys(a).length === 0 && Object.getPrototypeOf(a) === Object.prototype;
  } catch {
    return !1;
  }
}, Cl = Be("Date"), Ol = Be("File"), Dl = (a) => !!(a && typeof a.uri < "u"), Il = (a) => a && typeof a.getParts < "u", Pl = Be("Blob"), Fl = Be("FileList"), Ll = (a) => Rt(a) && Ne(a.pipe);
function Nl() {
  return typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : typeof global < "u" ? global : {};
}
const cr = Nl(), lr = typeof cr.FormData < "u" ? cr.FormData : void 0, jl = (a) => {
  if (!a) return !1;
  if (lr && a instanceof lr) return !0;
  const e = Zt(a);
  if (!e || e === Object.prototype || !Ne(a.append)) return !1;
  const t = tn(a);
  return t === "formdata" || // detect form-data instance
  t === "object" && Ne(a.toString) && a.toString() === "[object FormData]";
}, Ml = Be("URLSearchParams"), [Ul, ql, Bl, Hl] = [
  "ReadableStream",
  "Request",
  "Response",
  "Headers"
].map(Be), $l = (a) => a.trim ? a.trim() : a.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
function kt(a, e, { allOwnKeys: t = !1 } = {}) {
  if (a === null || typeof a > "u")
    return;
  let i, n;
  if (typeof a != "object" && (a = [a]), pt(a))
    for (i = 0, n = a.length; i < n; i++)
      e.call(null, a[i], i, a);
  else {
    if (St(a))
      return;
    const s = t ? Object.getOwnPropertyNames(a) : Object.keys(a), r = s.length;
    let c;
    for (i = 0; i < r; i++)
      c = s[i], e.call(null, a[c], c, a);
  }
}
function Ro(a, e) {
  if (St(a))
    return null;
  e = e.toLowerCase();
  const t = Object.keys(a);
  let i = t.length, n;
  for (; i-- > 0; )
    if (n = t[i], e === n.toLowerCase())
      return n;
  return null;
}
const Ze = typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : typeof window < "u" ? window : global, ko = (a) => !ct(a) && a !== Ze;
function Qi(...a) {
  const { caseless: e, skipUndefined: t } = ko(this) && this || {}, i = {}, n = (s, r) => {
    if (r === "__proto__" || r === "constructor" || r === "prototype")
      return;
    const c = e && Ro(i, r) || r, l = Zi(i, c) ? i[c] : void 0;
    Kt(l) && Kt(s) ? i[c] = Qi(l, s) : Kt(s) ? i[c] = Qi({}, s) : pt(s) ? i[c] = s.slice() : (!t || !ct(s)) && (i[c] = s);
  };
  for (let s = 0, r = a.length; s < r; s++)
    a[s] && kt(a[s], n);
  return i;
}
const Kl = (a, e, t, { allOwnKeys: i } = {}) => (kt(
  e,
  (n, s) => {
    t && Ne(n) ? Object.defineProperty(a, s, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot
      // hijack defineProperty's accessor-vs-data resolution.
      __proto__: null,
      value: _o(n, t),
      writable: !0,
      enumerable: !0,
      configurable: !0
    }) : Object.defineProperty(a, s, {
      __proto__: null,
      value: n,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  },
  { allOwnKeys: i }
), a), zl = (a) => (a.charCodeAt(0) === 65279 && (a = a.slice(1)), a), Yl = (a, e, t, i) => {
  a.prototype = Object.create(e.prototype, i), Object.defineProperty(a.prototype, "constructor", {
    __proto__: null,
    value: a,
    writable: !0,
    enumerable: !1,
    configurable: !0
  }), Object.defineProperty(a, "super", {
    __proto__: null,
    value: e.prototype
  }), t && Object.assign(a.prototype, t);
}, Wl = (a, e, t, i) => {
  let n, s, r;
  const c = {};
  if (e = e || {}, a == null) return e;
  do {
    for (n = Object.getOwnPropertyNames(a), s = n.length; s-- > 0; )
      r = n[s], (!i || i(r, a, e)) && !c[r] && (e[r] = a[r], c[r] = !0);
    a = t !== !1 && Zt(a);
  } while (a && (!t || t(a, e)) && a !== Object.prototype);
  return e;
}, Gl = (a, e, t) => {
  a = String(a), (t === void 0 || t > a.length) && (t = a.length), t -= e.length;
  const i = a.indexOf(e, t);
  return i !== -1 && i === t;
}, Vl = (a) => {
  if (!a) return null;
  if (pt(a)) return a;
  let e = a.length;
  if (!So(e)) return null;
  const t = new Array(e);
  for (; e-- > 0; )
    t[e] = a[e];
  return t;
}, Jl = /* @__PURE__ */ ((a) => (e) => a && e instanceof a)(typeof Uint8Array < "u" && Zt(Uint8Array)), Xl = (a, e) => {
  const i = (a && a[en]).call(a);
  let n;
  for (; (n = i.next()) && !n.done; ) {
    const s = n.value;
    e.call(a, s[0], s[1]);
  }
}, Ql = (a, e) => {
  let t;
  const i = [];
  for (; (t = a.exec(e)) !== null; )
    i.push(t);
  return i;
}, Zl = Be("HTMLFormElement"), eu = (a) => a.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function(t, i, n) {
  return i.toUpperCase() + n;
}), Zi = (({ hasOwnProperty: a }) => (e, t) => a.call(e, t))(Object.prototype), tu = Be("RegExp"), To = (a, e) => {
  const t = Object.getOwnPropertyDescriptors(a), i = {};
  kt(t, (n, s) => {
    let r;
    (r = e(n, s, a)) !== !1 && (i[s] = r || n);
  }), Object.defineProperties(a, i);
}, nu = (a) => {
  To(a, (e, t) => {
    if (Ne(a) && ["arguments", "caller", "callee"].includes(t))
      return !1;
    const i = a[t];
    if (Ne(i)) {
      if (e.enumerable = !1, "writable" in e) {
        e.writable = !1;
        return;
      }
      e.set || (e.set = () => {
        throw Error("Can not rewrite read-only method '" + t + "'");
      });
    }
  });
}, iu = (a, e) => {
  const t = {}, i = (n) => {
    n.forEach((s) => {
      t[s] = !0;
    });
  };
  return pt(a) ? i(a) : i(String(a).split(e)), t;
}, au = () => {
}, ru = (a, e) => a != null && Number.isFinite(a = +a) ? a : e;
function su(a) {
  return !!(a && Ne(a.append) && a[wo] === "FormData" && a[en]);
}
const ou = (a) => {
  const e = /* @__PURE__ */ new WeakSet(), t = (i) => {
    if (Rt(i)) {
      if (e.has(i))
        return;
      if (St(i))
        return i;
      if (!("toJSON" in i)) {
        e.add(i);
        const n = pt(i) ? [] : {};
        return kt(i, (s, r) => {
          const c = t(s);
          !ct(c) && (n[r] = c);
        }), e.delete(i), n;
      }
    }
    return i;
  };
  return t(a);
}, cu = Be("AsyncFunction"), lu = (a) => a && (Rt(a) || Ne(a)) && Ne(a.then) && Ne(a.catch), Ao = ((a, e) => a ? setImmediate : e ? ((t, i) => (Ze.addEventListener(
  "message",
  ({ source: n, data: s }) => {
    n === Ze && s === t && i.length && i.shift()();
  },
  !1
), (n) => {
  i.push(n), Ze.postMessage(t, "*");
}))(`axios@${Math.random()}`, []) : (t) => setTimeout(t))(typeof setImmediate == "function", Ne(Ze.postMessage)), uu = typeof queueMicrotask < "u" ? queueMicrotask.bind(Ze) : typeof process < "u" && process.nextTick || Ao, pu = (a) => a != null && Ne(a[en]), _ = {
  isArray: pt,
  isArrayBuffer: Eo,
  isBuffer: St,
  isFormData: jl,
  isArrayBufferView: Rl,
  isString: kl,
  isNumber: So,
  isBoolean: Tl,
  isObject: Rt,
  isPlainObject: Kt,
  isEmptyObject: Al,
  isReadableStream: Ul,
  isRequest: ql,
  isResponse: Bl,
  isHeaders: Hl,
  isUndefined: ct,
  isDate: Cl,
  isFile: Ol,
  isReactNativeBlob: Dl,
  isReactNative: Il,
  isBlob: Pl,
  isRegExp: tu,
  isFunction: Ne,
  isStream: Ll,
  isURLSearchParams: Ml,
  isTypedArray: Jl,
  isFileList: Fl,
  forEach: kt,
  merge: Qi,
  extend: Kl,
  trim: $l,
  stripBOM: zl,
  inherits: Yl,
  toFlatObject: Wl,
  kindOf: tn,
  kindOfTest: Be,
  endsWith: Gl,
  toArray: Vl,
  forEachEntry: Xl,
  matchAll: Ql,
  isHTMLForm: Zl,
  hasOwnProperty: Zi,
  hasOwnProp: Zi,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors: To,
  freezeMethods: nu,
  toObjectSet: iu,
  toCamelCase: eu,
  noop: au,
  toFiniteNumber: ru,
  findKey: Ro,
  global: Ze,
  isContextDefined: ko,
  isSpecCompliantForm: su,
  toJSONObject: ou,
  isAsyncFn: cu,
  isThenable: lu,
  setImmediate: Ao,
  asap: uu,
  isIterable: pu
}, du = _.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]), mu = (a) => {
  const e = {};
  let t, i, n;
  return a && a.split(`
`).forEach(function(r) {
    n = r.indexOf(":"), t = r.substring(0, n).trim().toLowerCase(), i = r.substring(n + 1).trim(), !(!t || e[t] && du[t]) && (t === "set-cookie" ? e[t] ? e[t].push(i) : e[t] = [i] : e[t] = e[t] ? e[t] + ", " + i : i);
  }), e;
};
function fu(a) {
  let e = 0, t = a.length;
  for (; e < t; ) {
    const i = a.charCodeAt(e);
    if (i !== 9 && i !== 32)
      break;
    e += 1;
  }
  for (; t > e; ) {
    const i = a.charCodeAt(t - 1);
    if (i !== 9 && i !== 32)
      break;
    t -= 1;
  }
  return e === 0 && t === a.length ? a : a.slice(e, t);
}
const hu = new RegExp("[\\u0000-\\u0008\\u000a-\\u001f\\u007f]+", "g"), vu = new RegExp("[^\\u0009\\u0020-\\u007e\\u0080-\\u00ff]+", "g");
function da(a, e) {
  return _.isArray(a) ? a.map((t) => da(t, e)) : fu(String(a).replace(e, ""));
}
const xu = (a) => da(a, hu), gu = (a) => da(a, vu);
function ma(a) {
  const e = /* @__PURE__ */ Object.create(null);
  return _.forEach(a.toJSON(), (t, i) => {
    e[i] = gu(t);
  }), e;
}
const ur = Symbol("internals");
function ht(a) {
  return a && String(a).trim().toLowerCase();
}
function zt(a) {
  return a === !1 || a == null ? a : _.isArray(a) ? a.map(zt) : xu(String(a));
}
function yu(a) {
  const e = /* @__PURE__ */ Object.create(null), t = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let i;
  for (; i = t.exec(a); )
    e[i[1]] = i[2];
  return e;
}
const bu = (a) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(a.trim());
function Kn(a, e, t, i, n) {
  if (_.isFunction(i))
    return i.call(this, e, t);
  if (n && (e = t), !!_.isString(e)) {
    if (_.isString(i))
      return e.indexOf(i) !== -1;
    if (_.isRegExp(i))
      return i.test(e);
  }
}
function _u(a) {
  return a.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (e, t, i) => t.toUpperCase() + i);
}
function wu(a, e) {
  const t = _.toCamelCase(" " + e);
  ["get", "set", "has"].forEach((i) => {
    Object.defineProperty(a, i + t, {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: function(n, s, r) {
        return this[i].call(this, e, n, s, r);
      },
      configurable: !0
    });
  });
}
let Oe = class {
  constructor(e) {
    e && this.set(e);
  }
  set(e, t, i) {
    const n = this;
    function s(c, l, p) {
      const m = ht(l);
      if (!m)
        throw new Error("header name must be a non-empty string");
      const u = _.findKey(n, m);
      (!u || n[u] === void 0 || p === !0 || p === void 0 && n[u] !== !1) && (n[u || l] = zt(c));
    }
    const r = (c, l) => _.forEach(c, (p, m) => s(p, m, l));
    if (_.isPlainObject(e) || e instanceof this.constructor)
      r(e, t);
    else if (_.isString(e) && (e = e.trim()) && !bu(e))
      r(mu(e), t);
    else if (_.isObject(e) && _.isIterable(e)) {
      let c = {}, l, p;
      for (const m of e) {
        if (!_.isArray(m))
          throw TypeError("Object iterator must return a key-value pair");
        c[p = m[0]] = (l = c[p]) ? _.isArray(l) ? [...l, m[1]] : [l, m[1]] : m[1];
      }
      r(c, t);
    } else
      e != null && s(t, e, i);
    return this;
  }
  get(e, t) {
    if (e = ht(e), e) {
      const i = _.findKey(this, e);
      if (i) {
        const n = this[i];
        if (!t)
          return n;
        if (t === !0)
          return yu(n);
        if (_.isFunction(t))
          return t.call(this, n, i);
        if (_.isRegExp(t))
          return t.exec(n);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(e, t) {
    if (e = ht(e), e) {
      const i = _.findKey(this, e);
      return !!(i && this[i] !== void 0 && (!t || Kn(this, this[i], i, t)));
    }
    return !1;
  }
  delete(e, t) {
    const i = this;
    let n = !1;
    function s(r) {
      if (r = ht(r), r) {
        const c = _.findKey(i, r);
        c && (!t || Kn(i, i[c], c, t)) && (delete i[c], n = !0);
      }
    }
    return _.isArray(e) ? e.forEach(s) : s(e), n;
  }
  clear(e) {
    const t = Object.keys(this);
    let i = t.length, n = !1;
    for (; i--; ) {
      const s = t[i];
      (!e || Kn(this, this[s], s, e, !0)) && (delete this[s], n = !0);
    }
    return n;
  }
  normalize(e) {
    const t = this, i = {};
    return _.forEach(this, (n, s) => {
      const r = _.findKey(i, s);
      if (r) {
        t[r] = zt(n), delete t[s];
        return;
      }
      const c = e ? _u(s) : String(s).trim();
      c !== s && delete t[s], t[c] = zt(n), i[c] = !0;
    }), this;
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const t = /* @__PURE__ */ Object.create(null);
    return _.forEach(this, (i, n) => {
      i != null && i !== !1 && (t[n] = e && _.isArray(i) ? i.join(", ") : i);
    }), t;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([e, t]) => e + ": " + t).join(`
`);
  }
  getSetCookie() {
    return this.get("set-cookie") || [];
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...t) {
    const i = new this(e);
    return t.forEach((n) => i.set(n)), i;
  }
  static accessor(e) {
    const i = (this[ur] = this[ur] = {
      accessors: {}
    }).accessors, n = this.prototype;
    function s(r) {
      const c = ht(r);
      i[c] || (wu(n, r), i[c] = !0);
    }
    return _.isArray(e) ? e.forEach(s) : s(e), this;
  }
};
Oe.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization"
]);
_.reduceDescriptors(Oe.prototype, ({ value: a }, e) => {
  let t = e[0].toUpperCase() + e.slice(1);
  return {
    get: () => a,
    set(i) {
      this[t] = i;
    }
  };
});
_.freezeMethods(Oe);
const Eu = "[REDACTED ****]";
function Su(a) {
  if (_.hasOwnProp(a, "toJSON"))
    return !0;
  let e = Object.getPrototypeOf(a);
  for (; e && e !== Object.prototype; ) {
    if (_.hasOwnProp(e, "toJSON"))
      return !0;
    e = Object.getPrototypeOf(e);
  }
  return !1;
}
function Ru(a, e) {
  const t = new Set(e.map((s) => String(s).toLowerCase())), i = [], n = (s) => {
    if (s === null || typeof s != "object" || _.isBuffer(s)) return s;
    if (i.indexOf(s) !== -1) return;
    s instanceof Oe && (s = s.toJSON()), i.push(s);
    let r;
    if (_.isArray(s))
      r = [], s.forEach((c, l) => {
        const p = n(c);
        _.isUndefined(p) || (r[l] = p);
      });
    else {
      if (!_.isPlainObject(s) && Su(s))
        return i.pop(), s;
      r = /* @__PURE__ */ Object.create(null);
      for (const [c, l] of Object.entries(s)) {
        const p = t.has(c.toLowerCase()) ? Eu : n(l);
        _.isUndefined(p) || (r[c] = p);
      }
    }
    return i.pop(), r;
  };
  return n(a);
}
let U = class Co extends Error {
  static from(e, t, i, n, s, r) {
    const c = new Co(e.message, t || e.code, i, n, s);
    return c.cause = e, c.name = e.name, e.status != null && c.status == null && (c.status = e.status), r && Object.assign(c, r), c;
  }
  /**
   * Create an Error with the specified message, config, error code, request and response.
   *
   * @param {string} message The error message.
   * @param {string} [code] The error code (for example, 'ECONNABORTED').
   * @param {Object} [config] The config.
   * @param {Object} [request] The request.
   * @param {Object} [response] The response.
   *
   * @returns {Error} The created error.
   */
  constructor(e, t, i, n, s) {
    super(e), Object.defineProperty(this, "message", {
      // Null-proto descriptor so a polluted Object.prototype.get cannot turn
      // this data descriptor into an accessor descriptor on the way in.
      __proto__: null,
      value: e,
      enumerable: !0,
      writable: !0,
      configurable: !0
    }), this.name = "AxiosError", this.isAxiosError = !0, t && (this.code = t), i && (this.config = i), n && (this.request = n), s && (this.response = s, this.status = s.status);
  }
  toJSON() {
    const e = this.config, t = e && _.hasOwnProp(e, "redact") ? e.redact : void 0, i = _.isArray(t) && t.length > 0 ? Ru(e, t) : _.toJSONObject(e);
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: i,
      code: this.code,
      status: this.status
    };
  }
};
U.ERR_BAD_OPTION_VALUE = "ERR_BAD_OPTION_VALUE";
U.ERR_BAD_OPTION = "ERR_BAD_OPTION";
U.ECONNABORTED = "ECONNABORTED";
U.ETIMEDOUT = "ETIMEDOUT";
U.ECONNREFUSED = "ECONNREFUSED";
U.ERR_NETWORK = "ERR_NETWORK";
U.ERR_FR_TOO_MANY_REDIRECTS = "ERR_FR_TOO_MANY_REDIRECTS";
U.ERR_DEPRECATED = "ERR_DEPRECATED";
U.ERR_BAD_RESPONSE = "ERR_BAD_RESPONSE";
U.ERR_BAD_REQUEST = "ERR_BAD_REQUEST";
U.ERR_CANCELED = "ERR_CANCELED";
U.ERR_NOT_SUPPORT = "ERR_NOT_SUPPORT";
U.ERR_INVALID_URL = "ERR_INVALID_URL";
U.ERR_FORM_DATA_DEPTH_EXCEEDED = "ERR_FORM_DATA_DEPTH_EXCEEDED";
var zn, pr;
function ku() {
  if (pr) return zn;
  pr = 1;
  var a = Ce.Stream, e = Qe;
  zn = t;
  function t() {
    this.source = null, this.dataSize = 0, this.maxDataSize = 1024 * 1024, this.pauseStream = !0, this._maxDataSizeExceeded = !1, this._released = !1, this._bufferedEvents = [];
  }
  return e.inherits(t, a), t.create = function(i, n) {
    var s = new this();
    n = n || {};
    for (var r in n)
      s[r] = n[r];
    s.source = i;
    var c = i.emit;
    return i.emit = function() {
      return s._handleEmit(arguments), c.apply(i, arguments);
    }, i.on("error", function() {
    }), s.pauseStream && i.pause(), s;
  }, Object.defineProperty(t.prototype, "readable", {
    configurable: !0,
    enumerable: !0,
    get: function() {
      return this.source.readable;
    }
  }), t.prototype.setEncoding = function() {
    return this.source.setEncoding.apply(this.source, arguments);
  }, t.prototype.resume = function() {
    this._released || this.release(), this.source.resume();
  }, t.prototype.pause = function() {
    this.source.pause();
  }, t.prototype.release = function() {
    this._released = !0, this._bufferedEvents.forEach((function(i) {
      this.emit.apply(this, i);
    }).bind(this)), this._bufferedEvents = [];
  }, t.prototype.pipe = function() {
    var i = a.prototype.pipe.apply(this, arguments);
    return this.resume(), i;
  }, t.prototype._handleEmit = function(i) {
    if (this._released) {
      this.emit.apply(this, i);
      return;
    }
    i[0] === "data" && (this.dataSize += i[1].length, this._checkIfMaxDataSizeExceeded()), this._bufferedEvents.push(i);
  }, t.prototype._checkIfMaxDataSizeExceeded = function() {
    if (!this._maxDataSizeExceeded && !(this.dataSize <= this.maxDataSize)) {
      this._maxDataSizeExceeded = !0;
      var i = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this.emit("error", new Error(i));
    }
  }, zn;
}
var Yn, dr;
function Tu() {
  if (dr) return Yn;
  dr = 1;
  var a = Qe, e = Ce.Stream, t = ku();
  Yn = i;
  function i() {
    this.writable = !1, this.readable = !0, this.dataSize = 0, this.maxDataSize = 2 * 1024 * 1024, this.pauseStreams = !0, this._released = !1, this._streams = [], this._currentStream = null, this._insideLoop = !1, this._pendingNext = !1;
  }
  return a.inherits(i, e), i.create = function(n) {
    var s = new this();
    n = n || {};
    for (var r in n)
      s[r] = n[r];
    return s;
  }, i.isStreamLike = function(n) {
    return typeof n != "function" && typeof n != "string" && typeof n != "boolean" && typeof n != "number" && !Buffer.isBuffer(n);
  }, i.prototype.append = function(n) {
    var s = i.isStreamLike(n);
    if (s) {
      if (!(n instanceof t)) {
        var r = t.create(n, {
          maxDataSize: 1 / 0,
          pauseStream: this.pauseStreams
        });
        n.on("data", this._checkDataSize.bind(this)), n = r;
      }
      this._handleErrors(n), this.pauseStreams && n.pause();
    }
    return this._streams.push(n), this;
  }, i.prototype.pipe = function(n, s) {
    return e.prototype.pipe.call(this, n, s), this.resume(), n;
  }, i.prototype._getNext = function() {
    if (this._currentStream = null, this._insideLoop) {
      this._pendingNext = !0;
      return;
    }
    this._insideLoop = !0;
    try {
      do
        this._pendingNext = !1, this._realGetNext();
      while (this._pendingNext);
    } finally {
      this._insideLoop = !1;
    }
  }, i.prototype._realGetNext = function() {
    var n = this._streams.shift();
    if (typeof n > "u") {
      this.end();
      return;
    }
    if (typeof n != "function") {
      this._pipeNext(n);
      return;
    }
    var s = n;
    s((function(r) {
      var c = i.isStreamLike(r);
      c && (r.on("data", this._checkDataSize.bind(this)), this._handleErrors(r)), this._pipeNext(r);
    }).bind(this));
  }, i.prototype._pipeNext = function(n) {
    this._currentStream = n;
    var s = i.isStreamLike(n);
    if (s) {
      n.on("end", this._getNext.bind(this)), n.pipe(this, { end: !1 });
      return;
    }
    var r = n;
    this.write(r), this._getNext();
  }, i.prototype._handleErrors = function(n) {
    var s = this;
    n.on("error", function(r) {
      s._emitError(r);
    });
  }, i.prototype.write = function(n) {
    this.emit("data", n);
  }, i.prototype.pause = function() {
    this.pauseStreams && (this.pauseStreams && this._currentStream && typeof this._currentStream.pause == "function" && this._currentStream.pause(), this.emit("pause"));
  }, i.prototype.resume = function() {
    this._released || (this._released = !0, this.writable = !0, this._getNext()), this.pauseStreams && this._currentStream && typeof this._currentStream.resume == "function" && this._currentStream.resume(), this.emit("resume");
  }, i.prototype.end = function() {
    this._reset(), this.emit("end");
  }, i.prototype.destroy = function() {
    this._reset(), this.emit("close");
  }, i.prototype._reset = function() {
    this.writable = !1, this._streams = [], this._currentStream = null;
  }, i.prototype._checkDataSize = function() {
    if (this._updateDataSize(), !(this.dataSize <= this.maxDataSize)) {
      var n = "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this._emitError(new Error(n));
    }
  }, i.prototype._updateDataSize = function() {
    this.dataSize = 0;
    var n = this;
    this._streams.forEach(function(s) {
      s.dataSize && (n.dataSize += s.dataSize);
    }), this._currentStream && this._currentStream.dataSize && (this.dataSize += this._currentStream.dataSize);
  }, i.prototype._emitError = function(n) {
    this._reset(), this.emit("error", n);
  }, Yn;
}
var Wn = {};
const Au = {
  "application/1d-interleaved-parityfec": { source: "iana" },
  "application/3gpdash-qoe-report+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/3gpp-ims+xml": { source: "iana", compressible: !0 },
  "application/3gpphal+json": { source: "iana", compressible: !0 },
  "application/3gpphalforms+json": { source: "iana", compressible: !0 },
  "application/a2l": { source: "iana" },
  "application/ace+cbor": { source: "iana" },
  "application/activemessage": { source: "iana" },
  "application/activity+json": { source: "iana", compressible: !0 },
  "application/alto-costmap+json": { source: "iana", compressible: !0 },
  "application/alto-costmapfilter+json": { source: "iana", compressible: !0 },
  "application/alto-directory+json": { source: "iana", compressible: !0 },
  "application/alto-endpointcost+json": { source: "iana", compressible: !0 },
  "application/alto-endpointcostparams+json": { source: "iana", compressible: !0 },
  "application/alto-endpointprop+json": { source: "iana", compressible: !0 },
  "application/alto-endpointpropparams+json": { source: "iana", compressible: !0 },
  "application/alto-error+json": { source: "iana", compressible: !0 },
  "application/alto-networkmap+json": { source: "iana", compressible: !0 },
  "application/alto-networkmapfilter+json": { source: "iana", compressible: !0 },
  "application/alto-updatestreamcontrol+json": { source: "iana", compressible: !0 },
  "application/alto-updatestreamparams+json": { source: "iana", compressible: !0 },
  "application/aml": { source: "iana" },
  "application/andrew-inset": { source: "iana", extensions: ["ez"] },
  "application/applefile": { source: "iana" },
  "application/applixware": { source: "apache", extensions: ["aw"] },
  "application/at+jwt": { source: "iana" },
  "application/atf": { source: "iana" },
  "application/atfx": { source: "iana" },
  "application/atom+xml": { source: "iana", compressible: !0, extensions: ["atom"] },
  "application/atomcat+xml": { source: "iana", compressible: !0, extensions: ["atomcat"] },
  "application/atomdeleted+xml": { source: "iana", compressible: !0, extensions: ["atomdeleted"] },
  "application/atomicmail": { source: "iana" },
  "application/atomsvc+xml": { source: "iana", compressible: !0, extensions: ["atomsvc"] },
  "application/atsc-dwd+xml": { source: "iana", compressible: !0, extensions: ["dwd"] },
  "application/atsc-dynamic-event-message": { source: "iana" },
  "application/atsc-held+xml": { source: "iana", compressible: !0, extensions: ["held"] },
  "application/atsc-rdt+json": { source: "iana", compressible: !0 },
  "application/atsc-rsat+xml": { source: "iana", compressible: !0, extensions: ["rsat"] },
  "application/atxml": { source: "iana" },
  "application/auth-policy+xml": { source: "iana", compressible: !0 },
  "application/bacnet-xdd+zip": { source: "iana", compressible: !1 },
  "application/batch-smtp": { source: "iana" },
  "application/bdoc": { compressible: !1, extensions: ["bdoc"] },
  "application/beep+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/calendar+json": { source: "iana", compressible: !0 },
  "application/calendar+xml": { source: "iana", compressible: !0, extensions: ["xcs"] },
  "application/call-completion": { source: "iana" },
  "application/cals-1840": { source: "iana" },
  "application/captive+json": { source: "iana", compressible: !0 },
  "application/cbor": { source: "iana" },
  "application/cbor-seq": { source: "iana" },
  "application/cccex": { source: "iana" },
  "application/ccmp+xml": { source: "iana", compressible: !0 },
  "application/ccxml+xml": { source: "iana", compressible: !0, extensions: ["ccxml"] },
  "application/cdfx+xml": { source: "iana", compressible: !0, extensions: ["cdfx"] },
  "application/cdmi-capability": { source: "iana", extensions: ["cdmia"] },
  "application/cdmi-container": { source: "iana", extensions: ["cdmic"] },
  "application/cdmi-domain": { source: "iana", extensions: ["cdmid"] },
  "application/cdmi-object": { source: "iana", extensions: ["cdmio"] },
  "application/cdmi-queue": { source: "iana", extensions: ["cdmiq"] },
  "application/cdni": { source: "iana" },
  "application/cea": { source: "iana" },
  "application/cea-2018+xml": { source: "iana", compressible: !0 },
  "application/cellml+xml": { source: "iana", compressible: !0 },
  "application/cfw": { source: "iana" },
  "application/city+json": { source: "iana", compressible: !0 },
  "application/clr": { source: "iana" },
  "application/clue+xml": { source: "iana", compressible: !0 },
  "application/clue_info+xml": { source: "iana", compressible: !0 },
  "application/cms": { source: "iana" },
  "application/cnrp+xml": { source: "iana", compressible: !0 },
  "application/coap-group+json": { source: "iana", compressible: !0 },
  "application/coap-payload": { source: "iana" },
  "application/commonground": { source: "iana" },
  "application/conference-info+xml": { source: "iana", compressible: !0 },
  "application/cose": { source: "iana" },
  "application/cose-key": { source: "iana" },
  "application/cose-key-set": { source: "iana" },
  "application/cpl+xml": { source: "iana", compressible: !0, extensions: ["cpl"] },
  "application/csrattrs": { source: "iana" },
  "application/csta+xml": { source: "iana", compressible: !0 },
  "application/cstadata+xml": { source: "iana", compressible: !0 },
  "application/csvm+json": { source: "iana", compressible: !0 },
  "application/cu-seeme": { source: "apache", extensions: ["cu"] },
  "application/cwt": { source: "iana" },
  "application/cybercash": { source: "iana" },
  "application/dart": { compressible: !0 },
  "application/dash+xml": { source: "iana", compressible: !0, extensions: ["mpd"] },
  "application/dash-patch+xml": { source: "iana", compressible: !0, extensions: ["mpp"] },
  "application/dashdelta": { source: "iana" },
  "application/davmount+xml": { source: "iana", compressible: !0, extensions: ["davmount"] },
  "application/dca-rft": { source: "iana" },
  "application/dcd": { source: "iana" },
  "application/dec-dx": { source: "iana" },
  "application/dialog-info+xml": { source: "iana", compressible: !0 },
  "application/dicom": { source: "iana" },
  "application/dicom+json": { source: "iana", compressible: !0 },
  "application/dicom+xml": { source: "iana", compressible: !0 },
  "application/dii": { source: "iana" },
  "application/dit": { source: "iana" },
  "application/dns": { source: "iana" },
  "application/dns+json": { source: "iana", compressible: !0 },
  "application/dns-message": { source: "iana" },
  "application/docbook+xml": { source: "apache", compressible: !0, extensions: ["dbk"] },
  "application/dots+cbor": { source: "iana" },
  "application/dskpp+xml": { source: "iana", compressible: !0 },
  "application/dssc+der": { source: "iana", extensions: ["dssc"] },
  "application/dssc+xml": { source: "iana", compressible: !0, extensions: ["xdssc"] },
  "application/dvcs": { source: "iana" },
  "application/ecmascript": { source: "iana", compressible: !0, extensions: ["es", "ecma"] },
  "application/edi-consent": { source: "iana" },
  "application/edi-x12": { source: "iana", compressible: !1 },
  "application/edifact": { source: "iana", compressible: !1 },
  "application/efi": { source: "iana" },
  "application/elm+json": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/elm+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.cap+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/emergencycalldata.comment+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.control+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.deviceinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.ecall.msd": { source: "iana" },
  "application/emergencycalldata.providerinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.serviceinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.subscriberinfo+xml": { source: "iana", compressible: !0 },
  "application/emergencycalldata.veds+xml": { source: "iana", compressible: !0 },
  "application/emma+xml": { source: "iana", compressible: !0, extensions: ["emma"] },
  "application/emotionml+xml": { source: "iana", compressible: !0, extensions: ["emotionml"] },
  "application/encaprtp": { source: "iana" },
  "application/epp+xml": { source: "iana", compressible: !0 },
  "application/epub+zip": { source: "iana", compressible: !1, extensions: ["epub"] },
  "application/eshop": { source: "iana" },
  "application/exi": { source: "iana", extensions: ["exi"] },
  "application/expect-ct-report+json": { source: "iana", compressible: !0 },
  "application/express": { source: "iana", extensions: ["exp"] },
  "application/fastinfoset": { source: "iana" },
  "application/fastsoap": { source: "iana" },
  "application/fdt+xml": { source: "iana", compressible: !0, extensions: ["fdt"] },
  "application/fhir+json": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/fhir+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/fido.trusted-apps+json": { compressible: !0 },
  "application/fits": { source: "iana" },
  "application/flexfec": { source: "iana" },
  "application/font-sfnt": { source: "iana" },
  "application/font-tdpfr": { source: "iana", extensions: ["pfr"] },
  "application/font-woff": { source: "iana", compressible: !1 },
  "application/framework-attributes+xml": { source: "iana", compressible: !0 },
  "application/geo+json": { source: "iana", compressible: !0, extensions: ["geojson"] },
  "application/geo+json-seq": { source: "iana" },
  "application/geopackage+sqlite3": { source: "iana" },
  "application/geoxacml+xml": { source: "iana", compressible: !0 },
  "application/gltf-buffer": { source: "iana" },
  "application/gml+xml": { source: "iana", compressible: !0, extensions: ["gml"] },
  "application/gpx+xml": { source: "apache", compressible: !0, extensions: ["gpx"] },
  "application/gxf": { source: "apache", extensions: ["gxf"] },
  "application/gzip": { source: "iana", compressible: !1, extensions: ["gz"] },
  "application/h224": { source: "iana" },
  "application/held+xml": { source: "iana", compressible: !0 },
  "application/hjson": { extensions: ["hjson"] },
  "application/http": { source: "iana" },
  "application/hyperstudio": { source: "iana", extensions: ["stk"] },
  "application/ibe-key-request+xml": { source: "iana", compressible: !0 },
  "application/ibe-pkg-reply+xml": { source: "iana", compressible: !0 },
  "application/ibe-pp-data": { source: "iana" },
  "application/iges": { source: "iana" },
  "application/im-iscomposing+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/index": { source: "iana" },
  "application/index.cmd": { source: "iana" },
  "application/index.obj": { source: "iana" },
  "application/index.response": { source: "iana" },
  "application/index.vnd": { source: "iana" },
  "application/inkml+xml": { source: "iana", compressible: !0, extensions: ["ink", "inkml"] },
  "application/iotp": { source: "iana" },
  "application/ipfix": { source: "iana", extensions: ["ipfix"] },
  "application/ipp": { source: "iana" },
  "application/isup": { source: "iana" },
  "application/its+xml": { source: "iana", compressible: !0, extensions: ["its"] },
  "application/java-archive": { source: "apache", compressible: !1, extensions: ["jar", "war", "ear"] },
  "application/java-serialized-object": { source: "apache", compressible: !1, extensions: ["ser"] },
  "application/java-vm": { source: "apache", compressible: !1, extensions: ["class"] },
  "application/javascript": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["js", "mjs"] },
  "application/jf2feed+json": { source: "iana", compressible: !0 },
  "application/jose": { source: "iana" },
  "application/jose+json": { source: "iana", compressible: !0 },
  "application/jrd+json": { source: "iana", compressible: !0 },
  "application/jscalendar+json": { source: "iana", compressible: !0 },
  "application/json": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["json", "map"] },
  "application/json-patch+json": { source: "iana", compressible: !0 },
  "application/json-seq": { source: "iana" },
  "application/json5": { extensions: ["json5"] },
  "application/jsonml+json": { source: "apache", compressible: !0, extensions: ["jsonml"] },
  "application/jwk+json": { source: "iana", compressible: !0 },
  "application/jwk-set+json": { source: "iana", compressible: !0 },
  "application/jwt": { source: "iana" },
  "application/kpml-request+xml": { source: "iana", compressible: !0 },
  "application/kpml-response+xml": { source: "iana", compressible: !0 },
  "application/ld+json": { source: "iana", compressible: !0, extensions: ["jsonld"] },
  "application/lgr+xml": { source: "iana", compressible: !0, extensions: ["lgr"] },
  "application/link-format": { source: "iana" },
  "application/load-control+xml": { source: "iana", compressible: !0 },
  "application/lost+xml": { source: "iana", compressible: !0, extensions: ["lostxml"] },
  "application/lostsync+xml": { source: "iana", compressible: !0 },
  "application/lpf+zip": { source: "iana", compressible: !1 },
  "application/lxf": { source: "iana" },
  "application/mac-binhex40": { source: "iana", extensions: ["hqx"] },
  "application/mac-compactpro": { source: "apache", extensions: ["cpt"] },
  "application/macwriteii": { source: "iana" },
  "application/mads+xml": { source: "iana", compressible: !0, extensions: ["mads"] },
  "application/manifest+json": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["webmanifest"] },
  "application/marc": { source: "iana", extensions: ["mrc"] },
  "application/marcxml+xml": { source: "iana", compressible: !0, extensions: ["mrcx"] },
  "application/mathematica": { source: "iana", extensions: ["ma", "nb", "mb"] },
  "application/mathml+xml": { source: "iana", compressible: !0, extensions: ["mathml"] },
  "application/mathml-content+xml": { source: "iana", compressible: !0 },
  "application/mathml-presentation+xml": { source: "iana", compressible: !0 },
  "application/mbms-associated-procedure-description+xml": { source: "iana", compressible: !0 },
  "application/mbms-deregister+xml": { source: "iana", compressible: !0 },
  "application/mbms-envelope+xml": { source: "iana", compressible: !0 },
  "application/mbms-msk+xml": { source: "iana", compressible: !0 },
  "application/mbms-msk-response+xml": { source: "iana", compressible: !0 },
  "application/mbms-protection-description+xml": { source: "iana", compressible: !0 },
  "application/mbms-reception-report+xml": { source: "iana", compressible: !0 },
  "application/mbms-register+xml": { source: "iana", compressible: !0 },
  "application/mbms-register-response+xml": { source: "iana", compressible: !0 },
  "application/mbms-schedule+xml": { source: "iana", compressible: !0 },
  "application/mbms-user-service-description+xml": { source: "iana", compressible: !0 },
  "application/mbox": { source: "iana", extensions: ["mbox"] },
  "application/media-policy-dataset+xml": { source: "iana", compressible: !0, extensions: ["mpf"] },
  "application/media_control+xml": { source: "iana", compressible: !0 },
  "application/mediaservercontrol+xml": { source: "iana", compressible: !0, extensions: ["mscml"] },
  "application/merge-patch+json": { source: "iana", compressible: !0 },
  "application/metalink+xml": { source: "apache", compressible: !0, extensions: ["metalink"] },
  "application/metalink4+xml": { source: "iana", compressible: !0, extensions: ["meta4"] },
  "application/mets+xml": { source: "iana", compressible: !0, extensions: ["mets"] },
  "application/mf4": { source: "iana" },
  "application/mikey": { source: "iana" },
  "application/mipc": { source: "iana" },
  "application/missing-blocks+cbor-seq": { source: "iana" },
  "application/mmt-aei+xml": { source: "iana", compressible: !0, extensions: ["maei"] },
  "application/mmt-usd+xml": { source: "iana", compressible: !0, extensions: ["musd"] },
  "application/mods+xml": { source: "iana", compressible: !0, extensions: ["mods"] },
  "application/moss-keys": { source: "iana" },
  "application/moss-signature": { source: "iana" },
  "application/mosskey-data": { source: "iana" },
  "application/mosskey-request": { source: "iana" },
  "application/mp21": { source: "iana", extensions: ["m21", "mp21"] },
  "application/mp4": { source: "iana", extensions: ["mp4s", "m4p"] },
  "application/mpeg4-generic": { source: "iana" },
  "application/mpeg4-iod": { source: "iana" },
  "application/mpeg4-iod-xmt": { source: "iana" },
  "application/mrb-consumer+xml": { source: "iana", compressible: !0 },
  "application/mrb-publish+xml": { source: "iana", compressible: !0 },
  "application/msc-ivr+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/msc-mixer+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/msword": { source: "iana", compressible: !1, extensions: ["doc", "dot"] },
  "application/mud+json": { source: "iana", compressible: !0 },
  "application/multipart-core": { source: "iana" },
  "application/mxf": { source: "iana", extensions: ["mxf"] },
  "application/n-quads": { source: "iana", extensions: ["nq"] },
  "application/n-triples": { source: "iana", extensions: ["nt"] },
  "application/nasdata": { source: "iana" },
  "application/news-checkgroups": { source: "iana", charset: "US-ASCII" },
  "application/news-groupinfo": { source: "iana", charset: "US-ASCII" },
  "application/news-transmission": { source: "iana" },
  "application/nlsml+xml": { source: "iana", compressible: !0 },
  "application/node": { source: "iana", extensions: ["cjs"] },
  "application/nss": { source: "iana" },
  "application/oauth-authz-req+jwt": { source: "iana" },
  "application/oblivious-dns-message": { source: "iana" },
  "application/ocsp-request": { source: "iana" },
  "application/ocsp-response": { source: "iana" },
  "application/octet-stream": { source: "iana", compressible: !1, extensions: ["bin", "dms", "lrf", "mar", "so", "dist", "distz", "pkg", "bpk", "dump", "elc", "deploy", "exe", "dll", "deb", "dmg", "iso", "img", "msi", "msp", "msm", "buffer"] },
  "application/oda": { source: "iana", extensions: ["oda"] },
  "application/odm+xml": { source: "iana", compressible: !0 },
  "application/odx": { source: "iana" },
  "application/oebps-package+xml": { source: "iana", compressible: !0, extensions: ["opf"] },
  "application/ogg": { source: "iana", compressible: !1, extensions: ["ogx"] },
  "application/omdoc+xml": { source: "apache", compressible: !0, extensions: ["omdoc"] },
  "application/onenote": { source: "apache", extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"] },
  "application/opc-nodeset+xml": { source: "iana", compressible: !0 },
  "application/oscore": { source: "iana" },
  "application/oxps": { source: "iana", extensions: ["oxps"] },
  "application/p21": { source: "iana" },
  "application/p21+zip": { source: "iana", compressible: !1 },
  "application/p2p-overlay+xml": { source: "iana", compressible: !0, extensions: ["relo"] },
  "application/parityfec": { source: "iana" },
  "application/passport": { source: "iana" },
  "application/patch-ops-error+xml": { source: "iana", compressible: !0, extensions: ["xer"] },
  "application/pdf": { source: "iana", compressible: !1, extensions: ["pdf"] },
  "application/pdx": { source: "iana" },
  "application/pem-certificate-chain": { source: "iana" },
  "application/pgp-encrypted": { source: "iana", compressible: !1, extensions: ["pgp"] },
  "application/pgp-keys": { source: "iana", extensions: ["asc"] },
  "application/pgp-signature": { source: "iana", extensions: ["asc", "sig"] },
  "application/pics-rules": { source: "apache", extensions: ["prf"] },
  "application/pidf+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/pidf-diff+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/pkcs10": { source: "iana", extensions: ["p10"] },
  "application/pkcs12": { source: "iana" },
  "application/pkcs7-mime": { source: "iana", extensions: ["p7m", "p7c"] },
  "application/pkcs7-signature": { source: "iana", extensions: ["p7s"] },
  "application/pkcs8": { source: "iana", extensions: ["p8"] },
  "application/pkcs8-encrypted": { source: "iana" },
  "application/pkix-attr-cert": { source: "iana", extensions: ["ac"] },
  "application/pkix-cert": { source: "iana", extensions: ["cer"] },
  "application/pkix-crl": { source: "iana", extensions: ["crl"] },
  "application/pkix-pkipath": { source: "iana", extensions: ["pkipath"] },
  "application/pkixcmp": { source: "iana", extensions: ["pki"] },
  "application/pls+xml": { source: "iana", compressible: !0, extensions: ["pls"] },
  "application/poc-settings+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/postscript": { source: "iana", compressible: !0, extensions: ["ai", "eps", "ps"] },
  "application/ppsp-tracker+json": { source: "iana", compressible: !0 },
  "application/problem+json": { source: "iana", compressible: !0 },
  "application/problem+xml": { source: "iana", compressible: !0 },
  "application/provenance+xml": { source: "iana", compressible: !0, extensions: ["provx"] },
  "application/prs.alvestrand.titrax-sheet": { source: "iana" },
  "application/prs.cww": { source: "iana", extensions: ["cww"] },
  "application/prs.cyn": { source: "iana", charset: "7-BIT" },
  "application/prs.hpub+zip": { source: "iana", compressible: !1 },
  "application/prs.nprend": { source: "iana" },
  "application/prs.plucker": { source: "iana" },
  "application/prs.rdf-xml-crypt": { source: "iana" },
  "application/prs.xsf+xml": { source: "iana", compressible: !0 },
  "application/pskc+xml": { source: "iana", compressible: !0, extensions: ["pskcxml"] },
  "application/pvd+json": { source: "iana", compressible: !0 },
  "application/qsig": { source: "iana" },
  "application/raml+yaml": { compressible: !0, extensions: ["raml"] },
  "application/raptorfec": { source: "iana" },
  "application/rdap+json": { source: "iana", compressible: !0 },
  "application/rdf+xml": { source: "iana", compressible: !0, extensions: ["rdf", "owl"] },
  "application/reginfo+xml": { source: "iana", compressible: !0, extensions: ["rif"] },
  "application/relax-ng-compact-syntax": { source: "iana", extensions: ["rnc"] },
  "application/remote-printing": { source: "iana" },
  "application/reputon+json": { source: "iana", compressible: !0 },
  "application/resource-lists+xml": { source: "iana", compressible: !0, extensions: ["rl"] },
  "application/resource-lists-diff+xml": { source: "iana", compressible: !0, extensions: ["rld"] },
  "application/rfc+xml": { source: "iana", compressible: !0 },
  "application/riscos": { source: "iana" },
  "application/rlmi+xml": { source: "iana", compressible: !0 },
  "application/rls-services+xml": { source: "iana", compressible: !0, extensions: ["rs"] },
  "application/route-apd+xml": { source: "iana", compressible: !0, extensions: ["rapd"] },
  "application/route-s-tsid+xml": { source: "iana", compressible: !0, extensions: ["sls"] },
  "application/route-usd+xml": { source: "iana", compressible: !0, extensions: ["rusd"] },
  "application/rpki-ghostbusters": { source: "iana", extensions: ["gbr"] },
  "application/rpki-manifest": { source: "iana", extensions: ["mft"] },
  "application/rpki-publication": { source: "iana" },
  "application/rpki-roa": { source: "iana", extensions: ["roa"] },
  "application/rpki-updown": { source: "iana" },
  "application/rsd+xml": { source: "apache", compressible: !0, extensions: ["rsd"] },
  "application/rss+xml": { source: "apache", compressible: !0, extensions: ["rss"] },
  "application/rtf": { source: "iana", compressible: !0, extensions: ["rtf"] },
  "application/rtploopback": { source: "iana" },
  "application/rtx": { source: "iana" },
  "application/samlassertion+xml": { source: "iana", compressible: !0 },
  "application/samlmetadata+xml": { source: "iana", compressible: !0 },
  "application/sarif+json": { source: "iana", compressible: !0 },
  "application/sarif-external-properties+json": { source: "iana", compressible: !0 },
  "application/sbe": { source: "iana" },
  "application/sbml+xml": { source: "iana", compressible: !0, extensions: ["sbml"] },
  "application/scaip+xml": { source: "iana", compressible: !0 },
  "application/scim+json": { source: "iana", compressible: !0 },
  "application/scvp-cv-request": { source: "iana", extensions: ["scq"] },
  "application/scvp-cv-response": { source: "iana", extensions: ["scs"] },
  "application/scvp-vp-request": { source: "iana", extensions: ["spq"] },
  "application/scvp-vp-response": { source: "iana", extensions: ["spp"] },
  "application/sdp": { source: "iana", extensions: ["sdp"] },
  "application/secevent+jwt": { source: "iana" },
  "application/senml+cbor": { source: "iana" },
  "application/senml+json": { source: "iana", compressible: !0 },
  "application/senml+xml": { source: "iana", compressible: !0, extensions: ["senmlx"] },
  "application/senml-etch+cbor": { source: "iana" },
  "application/senml-etch+json": { source: "iana", compressible: !0 },
  "application/senml-exi": { source: "iana" },
  "application/sensml+cbor": { source: "iana" },
  "application/sensml+json": { source: "iana", compressible: !0 },
  "application/sensml+xml": { source: "iana", compressible: !0, extensions: ["sensmlx"] },
  "application/sensml-exi": { source: "iana" },
  "application/sep+xml": { source: "iana", compressible: !0 },
  "application/sep-exi": { source: "iana" },
  "application/session-info": { source: "iana" },
  "application/set-payment": { source: "iana" },
  "application/set-payment-initiation": { source: "iana", extensions: ["setpay"] },
  "application/set-registration": { source: "iana" },
  "application/set-registration-initiation": { source: "iana", extensions: ["setreg"] },
  "application/sgml": { source: "iana" },
  "application/sgml-open-catalog": { source: "iana" },
  "application/shf+xml": { source: "iana", compressible: !0, extensions: ["shf"] },
  "application/sieve": { source: "iana", extensions: ["siv", "sieve"] },
  "application/simple-filter+xml": { source: "iana", compressible: !0 },
  "application/simple-message-summary": { source: "iana" },
  "application/simplesymbolcontainer": { source: "iana" },
  "application/sipc": { source: "iana" },
  "application/slate": { source: "iana" },
  "application/smil": { source: "iana" },
  "application/smil+xml": { source: "iana", compressible: !0, extensions: ["smi", "smil"] },
  "application/smpte336m": { source: "iana" },
  "application/soap+fastinfoset": { source: "iana" },
  "application/soap+xml": { source: "iana", compressible: !0 },
  "application/sparql-query": { source: "iana", extensions: ["rq"] },
  "application/sparql-results+xml": { source: "iana", compressible: !0, extensions: ["srx"] },
  "application/spdx+json": { source: "iana", compressible: !0 },
  "application/spirits-event+xml": { source: "iana", compressible: !0 },
  "application/sql": { source: "iana" },
  "application/srgs": { source: "iana", extensions: ["gram"] },
  "application/srgs+xml": { source: "iana", compressible: !0, extensions: ["grxml"] },
  "application/sru+xml": { source: "iana", compressible: !0, extensions: ["sru"] },
  "application/ssdl+xml": { source: "apache", compressible: !0, extensions: ["ssdl"] },
  "application/ssml+xml": { source: "iana", compressible: !0, extensions: ["ssml"] },
  "application/stix+json": { source: "iana", compressible: !0 },
  "application/swid+xml": { source: "iana", compressible: !0, extensions: ["swidtag"] },
  "application/tamp-apex-update": { source: "iana" },
  "application/tamp-apex-update-confirm": { source: "iana" },
  "application/tamp-community-update": { source: "iana" },
  "application/tamp-community-update-confirm": { source: "iana" },
  "application/tamp-error": { source: "iana" },
  "application/tamp-sequence-adjust": { source: "iana" },
  "application/tamp-sequence-adjust-confirm": { source: "iana" },
  "application/tamp-status-query": { source: "iana" },
  "application/tamp-status-response": { source: "iana" },
  "application/tamp-update": { source: "iana" },
  "application/tamp-update-confirm": { source: "iana" },
  "application/tar": { compressible: !0 },
  "application/taxii+json": { source: "iana", compressible: !0 },
  "application/td+json": { source: "iana", compressible: !0 },
  "application/tei+xml": { source: "iana", compressible: !0, extensions: ["tei", "teicorpus"] },
  "application/tetra_isi": { source: "iana" },
  "application/thraud+xml": { source: "iana", compressible: !0, extensions: ["tfi"] },
  "application/timestamp-query": { source: "iana" },
  "application/timestamp-reply": { source: "iana" },
  "application/timestamped-data": { source: "iana", extensions: ["tsd"] },
  "application/tlsrpt+gzip": { source: "iana" },
  "application/tlsrpt+json": { source: "iana", compressible: !0 },
  "application/tnauthlist": { source: "iana" },
  "application/token-introspection+jwt": { source: "iana" },
  "application/toml": { compressible: !0, extensions: ["toml"] },
  "application/trickle-ice-sdpfrag": { source: "iana" },
  "application/trig": { source: "iana", extensions: ["trig"] },
  "application/ttml+xml": { source: "iana", compressible: !0, extensions: ["ttml"] },
  "application/tve-trigger": { source: "iana" },
  "application/tzif": { source: "iana" },
  "application/tzif-leap": { source: "iana" },
  "application/ubjson": { compressible: !1, extensions: ["ubj"] },
  "application/ulpfec": { source: "iana" },
  "application/urc-grpsheet+xml": { source: "iana", compressible: !0 },
  "application/urc-ressheet+xml": { source: "iana", compressible: !0, extensions: ["rsheet"] },
  "application/urc-targetdesc+xml": { source: "iana", compressible: !0, extensions: ["td"] },
  "application/urc-uisocketdesc+xml": { source: "iana", compressible: !0 },
  "application/vcard+json": { source: "iana", compressible: !0 },
  "application/vcard+xml": { source: "iana", compressible: !0 },
  "application/vemmi": { source: "iana" },
  "application/vividence.scriptfile": { source: "apache" },
  "application/vnd.1000minds.decision-model+xml": { source: "iana", compressible: !0, extensions: ["1km"] },
  "application/vnd.3gpp-prose+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp-prose-pc3ch+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp-v2x-local-service-information": { source: "iana" },
  "application/vnd.3gpp.5gnas": { source: "iana" },
  "application/vnd.3gpp.access-transfer-events+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.bsf+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.gmop+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.gtpc": { source: "iana" },
  "application/vnd.3gpp.interworking-data": { source: "iana" },
  "application/vnd.3gpp.lpp": { source: "iana" },
  "application/vnd.3gpp.mc-signalling-ear": { source: "iana" },
  "application/vnd.3gpp.mcdata-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-payload": { source: "iana" },
  "application/vnd.3gpp.mcdata-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-signalling": { source: "iana" },
  "application/vnd.3gpp.mcdata-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcdata-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-floor-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-location-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-signed+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-ue-init-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcptt-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-affiliation-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-location-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-service-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-transmission-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-ue-config+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mcvideo-user-profile+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.mid-call+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.ngap": { source: "iana" },
  "application/vnd.3gpp.pfcp": { source: "iana" },
  "application/vnd.3gpp.pic-bw-large": { source: "iana", extensions: ["plb"] },
  "application/vnd.3gpp.pic-bw-small": { source: "iana", extensions: ["psb"] },
  "application/vnd.3gpp.pic-bw-var": { source: "iana", extensions: ["pvb"] },
  "application/vnd.3gpp.s1ap": { source: "iana" },
  "application/vnd.3gpp.sms": { source: "iana" },
  "application/vnd.3gpp.sms+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.srvcc-ext+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.srvcc-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.state-and-event-info+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp.ussd+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp2.bcmcsinfo+xml": { source: "iana", compressible: !0 },
  "application/vnd.3gpp2.sms": { source: "iana" },
  "application/vnd.3gpp2.tcap": { source: "iana", extensions: ["tcap"] },
  "application/vnd.3lightssoftware.imagescal": { source: "iana" },
  "application/vnd.3m.post-it-notes": { source: "iana", extensions: ["pwn"] },
  "application/vnd.accpac.simply.aso": { source: "iana", extensions: ["aso"] },
  "application/vnd.accpac.simply.imp": { source: "iana", extensions: ["imp"] },
  "application/vnd.acucobol": { source: "iana", extensions: ["acu"] },
  "application/vnd.acucorp": { source: "iana", extensions: ["atc", "acutc"] },
  "application/vnd.adobe.air-application-installer-package+zip": { source: "apache", compressible: !1, extensions: ["air"] },
  "application/vnd.adobe.flash.movie": { source: "iana" },
  "application/vnd.adobe.formscentral.fcdt": { source: "iana", extensions: ["fcdt"] },
  "application/vnd.adobe.fxp": { source: "iana", extensions: ["fxp", "fxpl"] },
  "application/vnd.adobe.partial-upload": { source: "iana" },
  "application/vnd.adobe.xdp+xml": { source: "iana", compressible: !0, extensions: ["xdp"] },
  "application/vnd.adobe.xfdf": { source: "iana", extensions: ["xfdf"] },
  "application/vnd.aether.imp": { source: "iana" },
  "application/vnd.afpc.afplinedata": { source: "iana" },
  "application/vnd.afpc.afplinedata-pagedef": { source: "iana" },
  "application/vnd.afpc.cmoca-cmresource": { source: "iana" },
  "application/vnd.afpc.foca-charset": { source: "iana" },
  "application/vnd.afpc.foca-codedfont": { source: "iana" },
  "application/vnd.afpc.foca-codepage": { source: "iana" },
  "application/vnd.afpc.modca": { source: "iana" },
  "application/vnd.afpc.modca-cmtable": { source: "iana" },
  "application/vnd.afpc.modca-formdef": { source: "iana" },
  "application/vnd.afpc.modca-mediummap": { source: "iana" },
  "application/vnd.afpc.modca-objectcontainer": { source: "iana" },
  "application/vnd.afpc.modca-overlay": { source: "iana" },
  "application/vnd.afpc.modca-pagesegment": { source: "iana" },
  "application/vnd.age": { source: "iana", extensions: ["age"] },
  "application/vnd.ah-barcode": { source: "iana" },
  "application/vnd.ahead.space": { source: "iana", extensions: ["ahead"] },
  "application/vnd.airzip.filesecure.azf": { source: "iana", extensions: ["azf"] },
  "application/vnd.airzip.filesecure.azs": { source: "iana", extensions: ["azs"] },
  "application/vnd.amadeus+json": { source: "iana", compressible: !0 },
  "application/vnd.amazon.ebook": { source: "apache", extensions: ["azw"] },
  "application/vnd.amazon.mobi8-ebook": { source: "iana" },
  "application/vnd.americandynamics.acc": { source: "iana", extensions: ["acc"] },
  "application/vnd.amiga.ami": { source: "iana", extensions: ["ami"] },
  "application/vnd.amundsen.maze+xml": { source: "iana", compressible: !0 },
  "application/vnd.android.ota": { source: "iana" },
  "application/vnd.android.package-archive": { source: "apache", compressible: !1, extensions: ["apk"] },
  "application/vnd.anki": { source: "iana" },
  "application/vnd.anser-web-certificate-issue-initiation": { source: "iana", extensions: ["cii"] },
  "application/vnd.anser-web-funds-transfer-initiation": { source: "apache", extensions: ["fti"] },
  "application/vnd.antix.game-component": { source: "iana", extensions: ["atx"] },
  "application/vnd.apache.arrow.file": { source: "iana" },
  "application/vnd.apache.arrow.stream": { source: "iana" },
  "application/vnd.apache.thrift.binary": { source: "iana" },
  "application/vnd.apache.thrift.compact": { source: "iana" },
  "application/vnd.apache.thrift.json": { source: "iana" },
  "application/vnd.api+json": { source: "iana", compressible: !0 },
  "application/vnd.aplextor.warrp+json": { source: "iana", compressible: !0 },
  "application/vnd.apothekende.reservation+json": { source: "iana", compressible: !0 },
  "application/vnd.apple.installer+xml": { source: "iana", compressible: !0, extensions: ["mpkg"] },
  "application/vnd.apple.keynote": { source: "iana", extensions: ["key"] },
  "application/vnd.apple.mpegurl": { source: "iana", extensions: ["m3u8"] },
  "application/vnd.apple.numbers": { source: "iana", extensions: ["numbers"] },
  "application/vnd.apple.pages": { source: "iana", extensions: ["pages"] },
  "application/vnd.apple.pkpass": { compressible: !1, extensions: ["pkpass"] },
  "application/vnd.arastra.swi": { source: "iana" },
  "application/vnd.aristanetworks.swi": { source: "iana", extensions: ["swi"] },
  "application/vnd.artisan+json": { source: "iana", compressible: !0 },
  "application/vnd.artsquare": { source: "iana" },
  "application/vnd.astraea-software.iota": { source: "iana", extensions: ["iota"] },
  "application/vnd.audiograph": { source: "iana", extensions: ["aep"] },
  "application/vnd.autopackage": { source: "iana" },
  "application/vnd.avalon+json": { source: "iana", compressible: !0 },
  "application/vnd.avistar+xml": { source: "iana", compressible: !0 },
  "application/vnd.balsamiq.bmml+xml": { source: "iana", compressible: !0, extensions: ["bmml"] },
  "application/vnd.balsamiq.bmpr": { source: "iana" },
  "application/vnd.banana-accounting": { source: "iana" },
  "application/vnd.bbf.usp.error": { source: "iana" },
  "application/vnd.bbf.usp.msg": { source: "iana" },
  "application/vnd.bbf.usp.msg+json": { source: "iana", compressible: !0 },
  "application/vnd.bekitzur-stech+json": { source: "iana", compressible: !0 },
  "application/vnd.bint.med-content": { source: "iana" },
  "application/vnd.biopax.rdf+xml": { source: "iana", compressible: !0 },
  "application/vnd.blink-idb-value-wrapper": { source: "iana" },
  "application/vnd.blueice.multipass": { source: "iana", extensions: ["mpm"] },
  "application/vnd.bluetooth.ep.oob": { source: "iana" },
  "application/vnd.bluetooth.le.oob": { source: "iana" },
  "application/vnd.bmi": { source: "iana", extensions: ["bmi"] },
  "application/vnd.bpf": { source: "iana" },
  "application/vnd.bpf3": { source: "iana" },
  "application/vnd.businessobjects": { source: "iana", extensions: ["rep"] },
  "application/vnd.byu.uapi+json": { source: "iana", compressible: !0 },
  "application/vnd.cab-jscript": { source: "iana" },
  "application/vnd.canon-cpdl": { source: "iana" },
  "application/vnd.canon-lips": { source: "iana" },
  "application/vnd.capasystems-pg+json": { source: "iana", compressible: !0 },
  "application/vnd.cendio.thinlinc.clientconf": { source: "iana" },
  "application/vnd.century-systems.tcp_stream": { source: "iana" },
  "application/vnd.chemdraw+xml": { source: "iana", compressible: !0, extensions: ["cdxml"] },
  "application/vnd.chess-pgn": { source: "iana" },
  "application/vnd.chipnuts.karaoke-mmd": { source: "iana", extensions: ["mmd"] },
  "application/vnd.ciedi": { source: "iana" },
  "application/vnd.cinderella": { source: "iana", extensions: ["cdy"] },
  "application/vnd.cirpack.isdn-ext": { source: "iana" },
  "application/vnd.citationstyles.style+xml": { source: "iana", compressible: !0, extensions: ["csl"] },
  "application/vnd.claymore": { source: "iana", extensions: ["cla"] },
  "application/vnd.cloanto.rp9": { source: "iana", extensions: ["rp9"] },
  "application/vnd.clonk.c4group": { source: "iana", extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"] },
  "application/vnd.cluetrust.cartomobile-config": { source: "iana", extensions: ["c11amc"] },
  "application/vnd.cluetrust.cartomobile-config-pkg": { source: "iana", extensions: ["c11amz"] },
  "application/vnd.coffeescript": { source: "iana" },
  "application/vnd.collabio.xodocuments.document": { source: "iana" },
  "application/vnd.collabio.xodocuments.document-template": { source: "iana" },
  "application/vnd.collabio.xodocuments.presentation": { source: "iana" },
  "application/vnd.collabio.xodocuments.presentation-template": { source: "iana" },
  "application/vnd.collabio.xodocuments.spreadsheet": { source: "iana" },
  "application/vnd.collabio.xodocuments.spreadsheet-template": { source: "iana" },
  "application/vnd.collection+json": { source: "iana", compressible: !0 },
  "application/vnd.collection.doc+json": { source: "iana", compressible: !0 },
  "application/vnd.collection.next+json": { source: "iana", compressible: !0 },
  "application/vnd.comicbook+zip": { source: "iana", compressible: !1 },
  "application/vnd.comicbook-rar": { source: "iana" },
  "application/vnd.commerce-battelle": { source: "iana" },
  "application/vnd.commonspace": { source: "iana", extensions: ["csp"] },
  "application/vnd.contact.cmsg": { source: "iana", extensions: ["cdbcmsg"] },
  "application/vnd.coreos.ignition+json": { source: "iana", compressible: !0 },
  "application/vnd.cosmocaller": { source: "iana", extensions: ["cmc"] },
  "application/vnd.crick.clicker": { source: "iana", extensions: ["clkx"] },
  "application/vnd.crick.clicker.keyboard": { source: "iana", extensions: ["clkk"] },
  "application/vnd.crick.clicker.palette": { source: "iana", extensions: ["clkp"] },
  "application/vnd.crick.clicker.template": { source: "iana", extensions: ["clkt"] },
  "application/vnd.crick.clicker.wordbank": { source: "iana", extensions: ["clkw"] },
  "application/vnd.criticaltools.wbs+xml": { source: "iana", compressible: !0, extensions: ["wbs"] },
  "application/vnd.cryptii.pipe+json": { source: "iana", compressible: !0 },
  "application/vnd.crypto-shade-file": { source: "iana" },
  "application/vnd.cryptomator.encrypted": { source: "iana" },
  "application/vnd.cryptomator.vault": { source: "iana" },
  "application/vnd.ctc-posml": { source: "iana", extensions: ["pml"] },
  "application/vnd.ctct.ws+xml": { source: "iana", compressible: !0 },
  "application/vnd.cups-pdf": { source: "iana" },
  "application/vnd.cups-postscript": { source: "iana" },
  "application/vnd.cups-ppd": { source: "iana", extensions: ["ppd"] },
  "application/vnd.cups-raster": { source: "iana" },
  "application/vnd.cups-raw": { source: "iana" },
  "application/vnd.curl": { source: "iana" },
  "application/vnd.curl.car": { source: "apache", extensions: ["car"] },
  "application/vnd.curl.pcurl": { source: "apache", extensions: ["pcurl"] },
  "application/vnd.cyan.dean.root+xml": { source: "iana", compressible: !0 },
  "application/vnd.cybank": { source: "iana" },
  "application/vnd.cyclonedx+json": { source: "iana", compressible: !0 },
  "application/vnd.cyclonedx+xml": { source: "iana", compressible: !0 },
  "application/vnd.d2l.coursepackage1p0+zip": { source: "iana", compressible: !1 },
  "application/vnd.d3m-dataset": { source: "iana" },
  "application/vnd.d3m-problem": { source: "iana" },
  "application/vnd.dart": { source: "iana", compressible: !0, extensions: ["dart"] },
  "application/vnd.data-vision.rdz": { source: "iana", extensions: ["rdz"] },
  "application/vnd.datapackage+json": { source: "iana", compressible: !0 },
  "application/vnd.dataresource+json": { source: "iana", compressible: !0 },
  "application/vnd.dbf": { source: "iana", extensions: ["dbf"] },
  "application/vnd.debian.binary-package": { source: "iana" },
  "application/vnd.dece.data": { source: "iana", extensions: ["uvf", "uvvf", "uvd", "uvvd"] },
  "application/vnd.dece.ttml+xml": { source: "iana", compressible: !0, extensions: ["uvt", "uvvt"] },
  "application/vnd.dece.unspecified": { source: "iana", extensions: ["uvx", "uvvx"] },
  "application/vnd.dece.zip": { source: "iana", extensions: ["uvz", "uvvz"] },
  "application/vnd.denovo.fcselayout-link": { source: "iana", extensions: ["fe_launch"] },
  "application/vnd.desmume.movie": { source: "iana" },
  "application/vnd.dir-bi.plate-dl-nosuffix": { source: "iana" },
  "application/vnd.dm.delegation+xml": { source: "iana", compressible: !0 },
  "application/vnd.dna": { source: "iana", extensions: ["dna"] },
  "application/vnd.document+json": { source: "iana", compressible: !0 },
  "application/vnd.dolby.mlp": { source: "apache", extensions: ["mlp"] },
  "application/vnd.dolby.mobile.1": { source: "iana" },
  "application/vnd.dolby.mobile.2": { source: "iana" },
  "application/vnd.doremir.scorecloud-binary-document": { source: "iana" },
  "application/vnd.dpgraph": { source: "iana", extensions: ["dpg"] },
  "application/vnd.dreamfactory": { source: "iana", extensions: ["dfac"] },
  "application/vnd.drive+json": { source: "iana", compressible: !0 },
  "application/vnd.ds-keypoint": { source: "apache", extensions: ["kpxx"] },
  "application/vnd.dtg.local": { source: "iana" },
  "application/vnd.dtg.local.flash": { source: "iana" },
  "application/vnd.dtg.local.html": { source: "iana" },
  "application/vnd.dvb.ait": { source: "iana", extensions: ["ait"] },
  "application/vnd.dvb.dvbisl+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.dvbj": { source: "iana" },
  "application/vnd.dvb.esgcontainer": { source: "iana" },
  "application/vnd.dvb.ipdcdftnotifaccess": { source: "iana" },
  "application/vnd.dvb.ipdcesgaccess": { source: "iana" },
  "application/vnd.dvb.ipdcesgaccess2": { source: "iana" },
  "application/vnd.dvb.ipdcesgpdd": { source: "iana" },
  "application/vnd.dvb.ipdcroaming": { source: "iana" },
  "application/vnd.dvb.iptv.alfec-base": { source: "iana" },
  "application/vnd.dvb.iptv.alfec-enhancement": { source: "iana" },
  "application/vnd.dvb.notif-aggregate-root+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-container+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-generic+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-msglist+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-registration-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-ia-registration-response+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.notif-init+xml": { source: "iana", compressible: !0 },
  "application/vnd.dvb.pfr": { source: "iana" },
  "application/vnd.dvb.service": { source: "iana", extensions: ["svc"] },
  "application/vnd.dxr": { source: "iana" },
  "application/vnd.dynageo": { source: "iana", extensions: ["geo"] },
  "application/vnd.dzr": { source: "iana" },
  "application/vnd.easykaraoke.cdgdownload": { source: "iana" },
  "application/vnd.ecdis-update": { source: "iana" },
  "application/vnd.ecip.rlp": { source: "iana" },
  "application/vnd.eclipse.ditto+json": { source: "iana", compressible: !0 },
  "application/vnd.ecowin.chart": { source: "iana", extensions: ["mag"] },
  "application/vnd.ecowin.filerequest": { source: "iana" },
  "application/vnd.ecowin.fileupdate": { source: "iana" },
  "application/vnd.ecowin.series": { source: "iana" },
  "application/vnd.ecowin.seriesrequest": { source: "iana" },
  "application/vnd.ecowin.seriesupdate": { source: "iana" },
  "application/vnd.efi.img": { source: "iana" },
  "application/vnd.efi.iso": { source: "iana" },
  "application/vnd.emclient.accessrequest+xml": { source: "iana", compressible: !0 },
  "application/vnd.enliven": { source: "iana", extensions: ["nml"] },
  "application/vnd.enphase.envoy": { source: "iana" },
  "application/vnd.eprints.data+xml": { source: "iana", compressible: !0 },
  "application/vnd.epson.esf": { source: "iana", extensions: ["esf"] },
  "application/vnd.epson.msf": { source: "iana", extensions: ["msf"] },
  "application/vnd.epson.quickanime": { source: "iana", extensions: ["qam"] },
  "application/vnd.epson.salt": { source: "iana", extensions: ["slt"] },
  "application/vnd.epson.ssf": { source: "iana", extensions: ["ssf"] },
  "application/vnd.ericsson.quickcall": { source: "iana" },
  "application/vnd.espass-espass+zip": { source: "iana", compressible: !1 },
  "application/vnd.eszigno3+xml": { source: "iana", compressible: !0, extensions: ["es3", "et3"] },
  "application/vnd.etsi.aoc+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.asic-e+zip": { source: "iana", compressible: !1 },
  "application/vnd.etsi.asic-s+zip": { source: "iana", compressible: !1 },
  "application/vnd.etsi.cug+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvcommand+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvdiscovery+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-bc+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-cod+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsad-npvr+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvservice+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvsync+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.iptvueprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.mcid+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.mheg5": { source: "iana" },
  "application/vnd.etsi.overload-control-policy-dataset+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.pstn+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.sci+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.simservs+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.timestamp-token": { source: "iana" },
  "application/vnd.etsi.tsl+xml": { source: "iana", compressible: !0 },
  "application/vnd.etsi.tsl.der": { source: "iana" },
  "application/vnd.eu.kasparian.car+json": { source: "iana", compressible: !0 },
  "application/vnd.eudora.data": { source: "iana" },
  "application/vnd.evolv.ecig.profile": { source: "iana" },
  "application/vnd.evolv.ecig.settings": { source: "iana" },
  "application/vnd.evolv.ecig.theme": { source: "iana" },
  "application/vnd.exstream-empower+zip": { source: "iana", compressible: !1 },
  "application/vnd.exstream-package": { source: "iana" },
  "application/vnd.ezpix-album": { source: "iana", extensions: ["ez2"] },
  "application/vnd.ezpix-package": { source: "iana", extensions: ["ez3"] },
  "application/vnd.f-secure.mobile": { source: "iana" },
  "application/vnd.familysearch.gedcom+zip": { source: "iana", compressible: !1 },
  "application/vnd.fastcopy-disk-image": { source: "iana" },
  "application/vnd.fdf": { source: "iana", extensions: ["fdf"] },
  "application/vnd.fdsn.mseed": { source: "iana", extensions: ["mseed"] },
  "application/vnd.fdsn.seed": { source: "iana", extensions: ["seed", "dataless"] },
  "application/vnd.ffsns": { source: "iana" },
  "application/vnd.ficlab.flb+zip": { source: "iana", compressible: !1 },
  "application/vnd.filmit.zfc": { source: "iana" },
  "application/vnd.fints": { source: "iana" },
  "application/vnd.firemonkeys.cloudcell": { source: "iana" },
  "application/vnd.flographit": { source: "iana", extensions: ["gph"] },
  "application/vnd.fluxtime.clip": { source: "iana", extensions: ["ftc"] },
  "application/vnd.font-fontforge-sfd": { source: "iana" },
  "application/vnd.framemaker": { source: "iana", extensions: ["fm", "frame", "maker", "book"] },
  "application/vnd.frogans.fnc": { source: "iana", extensions: ["fnc"] },
  "application/vnd.frogans.ltf": { source: "iana", extensions: ["ltf"] },
  "application/vnd.fsc.weblaunch": { source: "iana", extensions: ["fsc"] },
  "application/vnd.fujifilm.fb.docuworks": { source: "iana" },
  "application/vnd.fujifilm.fb.docuworks.binder": { source: "iana" },
  "application/vnd.fujifilm.fb.docuworks.container": { source: "iana" },
  "application/vnd.fujifilm.fb.jfi+xml": { source: "iana", compressible: !0 },
  "application/vnd.fujitsu.oasys": { source: "iana", extensions: ["oas"] },
  "application/vnd.fujitsu.oasys2": { source: "iana", extensions: ["oa2"] },
  "application/vnd.fujitsu.oasys3": { source: "iana", extensions: ["oa3"] },
  "application/vnd.fujitsu.oasysgp": { source: "iana", extensions: ["fg5"] },
  "application/vnd.fujitsu.oasysprs": { source: "iana", extensions: ["bh2"] },
  "application/vnd.fujixerox.art-ex": { source: "iana" },
  "application/vnd.fujixerox.art4": { source: "iana" },
  "application/vnd.fujixerox.ddd": { source: "iana", extensions: ["ddd"] },
  "application/vnd.fujixerox.docuworks": { source: "iana", extensions: ["xdw"] },
  "application/vnd.fujixerox.docuworks.binder": { source: "iana", extensions: ["xbd"] },
  "application/vnd.fujixerox.docuworks.container": { source: "iana" },
  "application/vnd.fujixerox.hbpl": { source: "iana" },
  "application/vnd.fut-misnet": { source: "iana" },
  "application/vnd.futoin+cbor": { source: "iana" },
  "application/vnd.futoin+json": { source: "iana", compressible: !0 },
  "application/vnd.fuzzysheet": { source: "iana", extensions: ["fzs"] },
  "application/vnd.genomatix.tuxedo": { source: "iana", extensions: ["txd"] },
  "application/vnd.gentics.grd+json": { source: "iana", compressible: !0 },
  "application/vnd.geo+json": { source: "iana", compressible: !0 },
  "application/vnd.geocube+xml": { source: "iana", compressible: !0 },
  "application/vnd.geogebra.file": { source: "iana", extensions: ["ggb"] },
  "application/vnd.geogebra.slides": { source: "iana" },
  "application/vnd.geogebra.tool": { source: "iana", extensions: ["ggt"] },
  "application/vnd.geometry-explorer": { source: "iana", extensions: ["gex", "gre"] },
  "application/vnd.geonext": { source: "iana", extensions: ["gxt"] },
  "application/vnd.geoplan": { source: "iana", extensions: ["g2w"] },
  "application/vnd.geospace": { source: "iana", extensions: ["g3w"] },
  "application/vnd.gerber": { source: "iana" },
  "application/vnd.globalplatform.card-content-mgt": { source: "iana" },
  "application/vnd.globalplatform.card-content-mgt-response": { source: "iana" },
  "application/vnd.gmx": { source: "iana", extensions: ["gmx"] },
  "application/vnd.google-apps.document": { compressible: !1, extensions: ["gdoc"] },
  "application/vnd.google-apps.presentation": { compressible: !1, extensions: ["gslides"] },
  "application/vnd.google-apps.spreadsheet": { compressible: !1, extensions: ["gsheet"] },
  "application/vnd.google-earth.kml+xml": { source: "iana", compressible: !0, extensions: ["kml"] },
  "application/vnd.google-earth.kmz": { source: "iana", compressible: !1, extensions: ["kmz"] },
  "application/vnd.gov.sk.e-form+xml": { source: "iana", compressible: !0 },
  "application/vnd.gov.sk.e-form+zip": { source: "iana", compressible: !1 },
  "application/vnd.gov.sk.xmldatacontainer+xml": { source: "iana", compressible: !0 },
  "application/vnd.grafeq": { source: "iana", extensions: ["gqf", "gqs"] },
  "application/vnd.gridmp": { source: "iana" },
  "application/vnd.groove-account": { source: "iana", extensions: ["gac"] },
  "application/vnd.groove-help": { source: "iana", extensions: ["ghf"] },
  "application/vnd.groove-identity-message": { source: "iana", extensions: ["gim"] },
  "application/vnd.groove-injector": { source: "iana", extensions: ["grv"] },
  "application/vnd.groove-tool-message": { source: "iana", extensions: ["gtm"] },
  "application/vnd.groove-tool-template": { source: "iana", extensions: ["tpl"] },
  "application/vnd.groove-vcard": { source: "iana", extensions: ["vcg"] },
  "application/vnd.hal+json": { source: "iana", compressible: !0 },
  "application/vnd.hal+xml": { source: "iana", compressible: !0, extensions: ["hal"] },
  "application/vnd.handheld-entertainment+xml": { source: "iana", compressible: !0, extensions: ["zmm"] },
  "application/vnd.hbci": { source: "iana", extensions: ["hbci"] },
  "application/vnd.hc+json": { source: "iana", compressible: !0 },
  "application/vnd.hcl-bireports": { source: "iana" },
  "application/vnd.hdt": { source: "iana" },
  "application/vnd.heroku+json": { source: "iana", compressible: !0 },
  "application/vnd.hhe.lesson-player": { source: "iana", extensions: ["les"] },
  "application/vnd.hl7cda+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.hl7v2+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.hp-hpgl": { source: "iana", extensions: ["hpgl"] },
  "application/vnd.hp-hpid": { source: "iana", extensions: ["hpid"] },
  "application/vnd.hp-hps": { source: "iana", extensions: ["hps"] },
  "application/vnd.hp-jlyt": { source: "iana", extensions: ["jlt"] },
  "application/vnd.hp-pcl": { source: "iana", extensions: ["pcl"] },
  "application/vnd.hp-pclxl": { source: "iana", extensions: ["pclxl"] },
  "application/vnd.httphone": { source: "iana" },
  "application/vnd.hydrostatix.sof-data": { source: "iana", extensions: ["sfd-hdstx"] },
  "application/vnd.hyper+json": { source: "iana", compressible: !0 },
  "application/vnd.hyper-item+json": { source: "iana", compressible: !0 },
  "application/vnd.hyperdrive+json": { source: "iana", compressible: !0 },
  "application/vnd.hzn-3d-crossword": { source: "iana" },
  "application/vnd.ibm.afplinedata": { source: "iana" },
  "application/vnd.ibm.electronic-media": { source: "iana" },
  "application/vnd.ibm.minipay": { source: "iana", extensions: ["mpy"] },
  "application/vnd.ibm.modcap": { source: "iana", extensions: ["afp", "listafp", "list3820"] },
  "application/vnd.ibm.rights-management": { source: "iana", extensions: ["irm"] },
  "application/vnd.ibm.secure-container": { source: "iana", extensions: ["sc"] },
  "application/vnd.iccprofile": { source: "iana", extensions: ["icc", "icm"] },
  "application/vnd.ieee.1905": { source: "iana" },
  "application/vnd.igloader": { source: "iana", extensions: ["igl"] },
  "application/vnd.imagemeter.folder+zip": { source: "iana", compressible: !1 },
  "application/vnd.imagemeter.image+zip": { source: "iana", compressible: !1 },
  "application/vnd.immervision-ivp": { source: "iana", extensions: ["ivp"] },
  "application/vnd.immervision-ivu": { source: "iana", extensions: ["ivu"] },
  "application/vnd.ims.imsccv1p1": { source: "iana" },
  "application/vnd.ims.imsccv1p2": { source: "iana" },
  "application/vnd.ims.imsccv1p3": { source: "iana" },
  "application/vnd.ims.lis.v2.result+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolproxy+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolproxy.id+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolsettings+json": { source: "iana", compressible: !0 },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": { source: "iana", compressible: !0 },
  "application/vnd.informedcontrol.rms+xml": { source: "iana", compressible: !0 },
  "application/vnd.informix-visionary": { source: "iana" },
  "application/vnd.infotech.project": { source: "iana" },
  "application/vnd.infotech.project+xml": { source: "iana", compressible: !0 },
  "application/vnd.innopath.wamp.notification": { source: "iana" },
  "application/vnd.insors.igm": { source: "iana", extensions: ["igm"] },
  "application/vnd.intercon.formnet": { source: "iana", extensions: ["xpw", "xpx"] },
  "application/vnd.intergeo": { source: "iana", extensions: ["i2g"] },
  "application/vnd.intertrust.digibox": { source: "iana" },
  "application/vnd.intertrust.nncp": { source: "iana" },
  "application/vnd.intu.qbo": { source: "iana", extensions: ["qbo"] },
  "application/vnd.intu.qfx": { source: "iana", extensions: ["qfx"] },
  "application/vnd.iptc.g2.catalogitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.conceptitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.knowledgeitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.newsitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.newsmessage+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.packageitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.iptc.g2.planningitem+xml": { source: "iana", compressible: !0 },
  "application/vnd.ipunplugged.rcprofile": { source: "iana", extensions: ["rcprofile"] },
  "application/vnd.irepository.package+xml": { source: "iana", compressible: !0, extensions: ["irp"] },
  "application/vnd.is-xpr": { source: "iana", extensions: ["xpr"] },
  "application/vnd.isac.fcs": { source: "iana", extensions: ["fcs"] },
  "application/vnd.iso11783-10+zip": { source: "iana", compressible: !1 },
  "application/vnd.jam": { source: "iana", extensions: ["jam"] },
  "application/vnd.japannet-directory-service": { source: "iana" },
  "application/vnd.japannet-jpnstore-wakeup": { source: "iana" },
  "application/vnd.japannet-payment-wakeup": { source: "iana" },
  "application/vnd.japannet-registration": { source: "iana" },
  "application/vnd.japannet-registration-wakeup": { source: "iana" },
  "application/vnd.japannet-setstore-wakeup": { source: "iana" },
  "application/vnd.japannet-verification": { source: "iana" },
  "application/vnd.japannet-verification-wakeup": { source: "iana" },
  "application/vnd.jcp.javame.midlet-rms": { source: "iana", extensions: ["rms"] },
  "application/vnd.jisp": { source: "iana", extensions: ["jisp"] },
  "application/vnd.joost.joda-archive": { source: "iana", extensions: ["joda"] },
  "application/vnd.jsk.isdn-ngn": { source: "iana" },
  "application/vnd.kahootz": { source: "iana", extensions: ["ktz", "ktr"] },
  "application/vnd.kde.karbon": { source: "iana", extensions: ["karbon"] },
  "application/vnd.kde.kchart": { source: "iana", extensions: ["chrt"] },
  "application/vnd.kde.kformula": { source: "iana", extensions: ["kfo"] },
  "application/vnd.kde.kivio": { source: "iana", extensions: ["flw"] },
  "application/vnd.kde.kontour": { source: "iana", extensions: ["kon"] },
  "application/vnd.kde.kpresenter": { source: "iana", extensions: ["kpr", "kpt"] },
  "application/vnd.kde.kspread": { source: "iana", extensions: ["ksp"] },
  "application/vnd.kde.kword": { source: "iana", extensions: ["kwd", "kwt"] },
  "application/vnd.kenameaapp": { source: "iana", extensions: ["htke"] },
  "application/vnd.kidspiration": { source: "iana", extensions: ["kia"] },
  "application/vnd.kinar": { source: "iana", extensions: ["kne", "knp"] },
  "application/vnd.koan": { source: "iana", extensions: ["skp", "skd", "skt", "skm"] },
  "application/vnd.kodak-descriptor": { source: "iana", extensions: ["sse"] },
  "application/vnd.las": { source: "iana" },
  "application/vnd.las.las+json": { source: "iana", compressible: !0 },
  "application/vnd.las.las+xml": { source: "iana", compressible: !0, extensions: ["lasxml"] },
  "application/vnd.laszip": { source: "iana" },
  "application/vnd.leap+json": { source: "iana", compressible: !0 },
  "application/vnd.liberty-request+xml": { source: "iana", compressible: !0 },
  "application/vnd.llamagraphics.life-balance.desktop": { source: "iana", extensions: ["lbd"] },
  "application/vnd.llamagraphics.life-balance.exchange+xml": { source: "iana", compressible: !0, extensions: ["lbe"] },
  "application/vnd.logipipe.circuit+zip": { source: "iana", compressible: !1 },
  "application/vnd.loom": { source: "iana" },
  "application/vnd.lotus-1-2-3": { source: "iana", extensions: ["123"] },
  "application/vnd.lotus-approach": { source: "iana", extensions: ["apr"] },
  "application/vnd.lotus-freelance": { source: "iana", extensions: ["pre"] },
  "application/vnd.lotus-notes": { source: "iana", extensions: ["nsf"] },
  "application/vnd.lotus-organizer": { source: "iana", extensions: ["org"] },
  "application/vnd.lotus-screencam": { source: "iana", extensions: ["scm"] },
  "application/vnd.lotus-wordpro": { source: "iana", extensions: ["lwp"] },
  "application/vnd.macports.portpkg": { source: "iana", extensions: ["portpkg"] },
  "application/vnd.mapbox-vector-tile": { source: "iana", extensions: ["mvt"] },
  "application/vnd.marlin.drm.actiontoken+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.conftoken+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.license+xml": { source: "iana", compressible: !0 },
  "application/vnd.marlin.drm.mdcf": { source: "iana" },
  "application/vnd.mason+json": { source: "iana", compressible: !0 },
  "application/vnd.maxar.archive.3tz+zip": { source: "iana", compressible: !1 },
  "application/vnd.maxmind.maxmind-db": { source: "iana" },
  "application/vnd.mcd": { source: "iana", extensions: ["mcd"] },
  "application/vnd.medcalcdata": { source: "iana", extensions: ["mc1"] },
  "application/vnd.mediastation.cdkey": { source: "iana", extensions: ["cdkey"] },
  "application/vnd.meridian-slingshot": { source: "iana" },
  "application/vnd.mfer": { source: "iana", extensions: ["mwf"] },
  "application/vnd.mfmp": { source: "iana", extensions: ["mfm"] },
  "application/vnd.micro+json": { source: "iana", compressible: !0 },
  "application/vnd.micrografx.flo": { source: "iana", extensions: ["flo"] },
  "application/vnd.micrografx.igx": { source: "iana", extensions: ["igx"] },
  "application/vnd.microsoft.portable-executable": { source: "iana" },
  "application/vnd.microsoft.windows.thumbnail-cache": { source: "iana" },
  "application/vnd.miele+json": { source: "iana", compressible: !0 },
  "application/vnd.mif": { source: "iana", extensions: ["mif"] },
  "application/vnd.minisoft-hp3000-save": { source: "iana" },
  "application/vnd.mitsubishi.misty-guard.trustweb": { source: "iana" },
  "application/vnd.mobius.daf": { source: "iana", extensions: ["daf"] },
  "application/vnd.mobius.dis": { source: "iana", extensions: ["dis"] },
  "application/vnd.mobius.mbk": { source: "iana", extensions: ["mbk"] },
  "application/vnd.mobius.mqy": { source: "iana", extensions: ["mqy"] },
  "application/vnd.mobius.msl": { source: "iana", extensions: ["msl"] },
  "application/vnd.mobius.plc": { source: "iana", extensions: ["plc"] },
  "application/vnd.mobius.txf": { source: "iana", extensions: ["txf"] },
  "application/vnd.mophun.application": { source: "iana", extensions: ["mpn"] },
  "application/vnd.mophun.certificate": { source: "iana", extensions: ["mpc"] },
  "application/vnd.motorola.flexsuite": { source: "iana" },
  "application/vnd.motorola.flexsuite.adsi": { source: "iana" },
  "application/vnd.motorola.flexsuite.fis": { source: "iana" },
  "application/vnd.motorola.flexsuite.gotap": { source: "iana" },
  "application/vnd.motorola.flexsuite.kmr": { source: "iana" },
  "application/vnd.motorola.flexsuite.ttc": { source: "iana" },
  "application/vnd.motorola.flexsuite.wem": { source: "iana" },
  "application/vnd.motorola.iprm": { source: "iana" },
  "application/vnd.mozilla.xul+xml": { source: "iana", compressible: !0, extensions: ["xul"] },
  "application/vnd.ms-3mfdocument": { source: "iana" },
  "application/vnd.ms-artgalry": { source: "iana", extensions: ["cil"] },
  "application/vnd.ms-asf": { source: "iana" },
  "application/vnd.ms-cab-compressed": { source: "iana", extensions: ["cab"] },
  "application/vnd.ms-color.iccprofile": { source: "apache" },
  "application/vnd.ms-excel": { source: "iana", compressible: !1, extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"] },
  "application/vnd.ms-excel.addin.macroenabled.12": { source: "iana", extensions: ["xlam"] },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": { source: "iana", extensions: ["xlsb"] },
  "application/vnd.ms-excel.sheet.macroenabled.12": { source: "iana", extensions: ["xlsm"] },
  "application/vnd.ms-excel.template.macroenabled.12": { source: "iana", extensions: ["xltm"] },
  "application/vnd.ms-fontobject": { source: "iana", compressible: !0, extensions: ["eot"] },
  "application/vnd.ms-htmlhelp": { source: "iana", extensions: ["chm"] },
  "application/vnd.ms-ims": { source: "iana", extensions: ["ims"] },
  "application/vnd.ms-lrm": { source: "iana", extensions: ["lrm"] },
  "application/vnd.ms-office.activex+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-officetheme": { source: "iana", extensions: ["thmx"] },
  "application/vnd.ms-opentype": { source: "apache", compressible: !0 },
  "application/vnd.ms-outlook": { compressible: !1, extensions: ["msg"] },
  "application/vnd.ms-package.obfuscated-opentype": { source: "apache" },
  "application/vnd.ms-pki.seccat": { source: "apache", extensions: ["cat"] },
  "application/vnd.ms-pki.stl": { source: "apache", extensions: ["stl"] },
  "application/vnd.ms-playready.initiator+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-powerpoint": { source: "iana", compressible: !1, extensions: ["ppt", "pps", "pot"] },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": { source: "iana", extensions: ["ppam"] },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": { source: "iana", extensions: ["pptm"] },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": { source: "iana", extensions: ["sldm"] },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": { source: "iana", extensions: ["ppsm"] },
  "application/vnd.ms-powerpoint.template.macroenabled.12": { source: "iana", extensions: ["potm"] },
  "application/vnd.ms-printdevicecapabilities+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-printing.printticket+xml": { source: "apache", compressible: !0 },
  "application/vnd.ms-printschematicket+xml": { source: "iana", compressible: !0 },
  "application/vnd.ms-project": { source: "iana", extensions: ["mpp", "mpt"] },
  "application/vnd.ms-tnef": { source: "iana" },
  "application/vnd.ms-windows.devicepairing": { source: "iana" },
  "application/vnd.ms-windows.nwprinting.oob": { source: "iana" },
  "application/vnd.ms-windows.printerpairing": { source: "iana" },
  "application/vnd.ms-windows.wsd.oob": { source: "iana" },
  "application/vnd.ms-wmdrm.lic-chlg-req": { source: "iana" },
  "application/vnd.ms-wmdrm.lic-resp": { source: "iana" },
  "application/vnd.ms-wmdrm.meter-chlg-req": { source: "iana" },
  "application/vnd.ms-wmdrm.meter-resp": { source: "iana" },
  "application/vnd.ms-word.document.macroenabled.12": { source: "iana", extensions: ["docm"] },
  "application/vnd.ms-word.template.macroenabled.12": { source: "iana", extensions: ["dotm"] },
  "application/vnd.ms-works": { source: "iana", extensions: ["wps", "wks", "wcm", "wdb"] },
  "application/vnd.ms-wpl": { source: "iana", extensions: ["wpl"] },
  "application/vnd.ms-xpsdocument": { source: "iana", compressible: !1, extensions: ["xps"] },
  "application/vnd.msa-disk-image": { source: "iana" },
  "application/vnd.mseq": { source: "iana", extensions: ["mseq"] },
  "application/vnd.msign": { source: "iana" },
  "application/vnd.multiad.creator": { source: "iana" },
  "application/vnd.multiad.creator.cif": { source: "iana" },
  "application/vnd.music-niff": { source: "iana" },
  "application/vnd.musician": { source: "iana", extensions: ["mus"] },
  "application/vnd.muvee.style": { source: "iana", extensions: ["msty"] },
  "application/vnd.mynfc": { source: "iana", extensions: ["taglet"] },
  "application/vnd.nacamar.ybrid+json": { source: "iana", compressible: !0 },
  "application/vnd.ncd.control": { source: "iana" },
  "application/vnd.ncd.reference": { source: "iana" },
  "application/vnd.nearst.inv+json": { source: "iana", compressible: !0 },
  "application/vnd.nebumind.line": { source: "iana" },
  "application/vnd.nervana": { source: "iana" },
  "application/vnd.netfpx": { source: "iana" },
  "application/vnd.neurolanguage.nlu": { source: "iana", extensions: ["nlu"] },
  "application/vnd.nimn": { source: "iana" },
  "application/vnd.nintendo.nitro.rom": { source: "iana" },
  "application/vnd.nintendo.snes.rom": { source: "iana" },
  "application/vnd.nitf": { source: "iana", extensions: ["ntf", "nitf"] },
  "application/vnd.noblenet-directory": { source: "iana", extensions: ["nnd"] },
  "application/vnd.noblenet-sealer": { source: "iana", extensions: ["nns"] },
  "application/vnd.noblenet-web": { source: "iana", extensions: ["nnw"] },
  "application/vnd.nokia.catalogs": { source: "iana" },
  "application/vnd.nokia.conml+wbxml": { source: "iana" },
  "application/vnd.nokia.conml+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.iptv.config+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.isds-radio-presets": { source: "iana" },
  "application/vnd.nokia.landmark+wbxml": { source: "iana" },
  "application/vnd.nokia.landmark+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.landmarkcollection+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.n-gage.ac+xml": { source: "iana", compressible: !0, extensions: ["ac"] },
  "application/vnd.nokia.n-gage.data": { source: "iana", extensions: ["ngdat"] },
  "application/vnd.nokia.n-gage.symbian.install": { source: "iana", extensions: ["n-gage"] },
  "application/vnd.nokia.ncd": { source: "iana" },
  "application/vnd.nokia.pcd+wbxml": { source: "iana" },
  "application/vnd.nokia.pcd+xml": { source: "iana", compressible: !0 },
  "application/vnd.nokia.radio-preset": { source: "iana", extensions: ["rpst"] },
  "application/vnd.nokia.radio-presets": { source: "iana", extensions: ["rpss"] },
  "application/vnd.novadigm.edm": { source: "iana", extensions: ["edm"] },
  "application/vnd.novadigm.edx": { source: "iana", extensions: ["edx"] },
  "application/vnd.novadigm.ext": { source: "iana", extensions: ["ext"] },
  "application/vnd.ntt-local.content-share": { source: "iana" },
  "application/vnd.ntt-local.file-transfer": { source: "iana" },
  "application/vnd.ntt-local.ogw_remote-access": { source: "iana" },
  "application/vnd.ntt-local.sip-ta_remote": { source: "iana" },
  "application/vnd.ntt-local.sip-ta_tcp_stream": { source: "iana" },
  "application/vnd.oasis.opendocument.chart": { source: "iana", extensions: ["odc"] },
  "application/vnd.oasis.opendocument.chart-template": { source: "iana", extensions: ["otc"] },
  "application/vnd.oasis.opendocument.database": { source: "iana", extensions: ["odb"] },
  "application/vnd.oasis.opendocument.formula": { source: "iana", extensions: ["odf"] },
  "application/vnd.oasis.opendocument.formula-template": { source: "iana", extensions: ["odft"] },
  "application/vnd.oasis.opendocument.graphics": { source: "iana", compressible: !1, extensions: ["odg"] },
  "application/vnd.oasis.opendocument.graphics-template": { source: "iana", extensions: ["otg"] },
  "application/vnd.oasis.opendocument.image": { source: "iana", extensions: ["odi"] },
  "application/vnd.oasis.opendocument.image-template": { source: "iana", extensions: ["oti"] },
  "application/vnd.oasis.opendocument.presentation": { source: "iana", compressible: !1, extensions: ["odp"] },
  "application/vnd.oasis.opendocument.presentation-template": { source: "iana", extensions: ["otp"] },
  "application/vnd.oasis.opendocument.spreadsheet": { source: "iana", compressible: !1, extensions: ["ods"] },
  "application/vnd.oasis.opendocument.spreadsheet-template": { source: "iana", extensions: ["ots"] },
  "application/vnd.oasis.opendocument.text": { source: "iana", compressible: !1, extensions: ["odt"] },
  "application/vnd.oasis.opendocument.text-master": { source: "iana", extensions: ["odm"] },
  "application/vnd.oasis.opendocument.text-template": { source: "iana", extensions: ["ott"] },
  "application/vnd.oasis.opendocument.text-web": { source: "iana", extensions: ["oth"] },
  "application/vnd.obn": { source: "iana" },
  "application/vnd.ocf+cbor": { source: "iana" },
  "application/vnd.oci.image.manifest.v1+json": { source: "iana", compressible: !0 },
  "application/vnd.oftn.l10n+json": { source: "iana", compressible: !0 },
  "application/vnd.oipf.contentaccessdownload+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.contentaccessstreaming+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.cspg-hexbinary": { source: "iana" },
  "application/vnd.oipf.dae.svg+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.dae.xhtml+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.mippvcontrolmessage+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.pae.gem": { source: "iana" },
  "application/vnd.oipf.spdiscovery+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.spdlist+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.ueprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.oipf.userprofile+xml": { source: "iana", compressible: !0 },
  "application/vnd.olpc-sugar": { source: "iana", extensions: ["xo"] },
  "application/vnd.oma-scws-config": { source: "iana" },
  "application/vnd.oma-scws-http-request": { source: "iana" },
  "application/vnd.oma-scws-http-response": { source: "iana" },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.drm-trigger+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.imd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.ltkm": { source: "iana" },
  "application/vnd.oma.bcast.notification+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.provisioningtrigger": { source: "iana" },
  "application/vnd.oma.bcast.sgboot": { source: "iana" },
  "application/vnd.oma.bcast.sgdd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.sgdu": { source: "iana" },
  "application/vnd.oma.bcast.simple-symbol-container": { source: "iana" },
  "application/vnd.oma.bcast.smartcard-trigger+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.sprov+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.bcast.stkm": { source: "iana" },
  "application/vnd.oma.cab-address-book+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-feature-handler+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-pcc+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-subs-invite+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.cab-user-prefs+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.dcd": { source: "iana" },
  "application/vnd.oma.dcdc": { source: "iana" },
  "application/vnd.oma.dd2+xml": { source: "iana", compressible: !0, extensions: ["dd2"] },
  "application/vnd.oma.drm.risd+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.group-usage-list+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.lwm2m+cbor": { source: "iana" },
  "application/vnd.oma.lwm2m+json": { source: "iana", compressible: !0 },
  "application/vnd.oma.lwm2m+tlv": { source: "iana" },
  "application/vnd.oma.pal+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.detailed-progress-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.final-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.groups+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.invocation-descriptor+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.poc.optimized-progress-report+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.push": { source: "iana" },
  "application/vnd.oma.scidm.messages+xml": { source: "iana", compressible: !0 },
  "application/vnd.oma.xcap-directory+xml": { source: "iana", compressible: !0 },
  "application/vnd.omads-email+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omads-file+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omads-folder+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.omaloc-supl-init": { source: "iana" },
  "application/vnd.onepager": { source: "iana" },
  "application/vnd.onepagertamp": { source: "iana" },
  "application/vnd.onepagertamx": { source: "iana" },
  "application/vnd.onepagertat": { source: "iana" },
  "application/vnd.onepagertatp": { source: "iana" },
  "application/vnd.onepagertatx": { source: "iana" },
  "application/vnd.openblox.game+xml": { source: "iana", compressible: !0, extensions: ["obgx"] },
  "application/vnd.openblox.game-binary": { source: "iana" },
  "application/vnd.openeye.oeb": { source: "iana" },
  "application/vnd.openofficeorg.extension": { source: "apache", extensions: ["oxt"] },
  "application/vnd.openstreetmap.data+xml": { source: "iana", compressible: !0, extensions: ["osm"] },
  "application/vnd.opentimestamps.ots": { source: "iana" },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawing+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": { source: "iana", compressible: !1, extensions: ["pptx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": { source: "iana", extensions: ["sldx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": { source: "iana", extensions: ["ppsx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.template": { source: "iana", extensions: ["potx"] },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { source: "iana", compressible: !1, extensions: ["xlsx"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": { source: "iana", extensions: ["xltx"] },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.theme+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.vmldrawing": { source: "iana" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { source: "iana", compressible: !1, extensions: ["docx"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": { source: "iana", extensions: ["dotx"] },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.core-properties+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": { source: "iana", compressible: !0 },
  "application/vnd.openxmlformats-package.relationships+xml": { source: "iana", compressible: !0 },
  "application/vnd.oracle.resource+json": { source: "iana", compressible: !0 },
  "application/vnd.orange.indata": { source: "iana" },
  "application/vnd.osa.netdeploy": { source: "iana" },
  "application/vnd.osgeo.mapguide.package": { source: "iana", extensions: ["mgp"] },
  "application/vnd.osgi.bundle": { source: "iana" },
  "application/vnd.osgi.dp": { source: "iana", extensions: ["dp"] },
  "application/vnd.osgi.subsystem": { source: "iana", extensions: ["esa"] },
  "application/vnd.otps.ct-kip+xml": { source: "iana", compressible: !0 },
  "application/vnd.oxli.countgraph": { source: "iana" },
  "application/vnd.pagerduty+json": { source: "iana", compressible: !0 },
  "application/vnd.palm": { source: "iana", extensions: ["pdb", "pqa", "oprc"] },
  "application/vnd.panoply": { source: "iana" },
  "application/vnd.paos.xml": { source: "iana" },
  "application/vnd.patentdive": { source: "iana" },
  "application/vnd.patientecommsdoc": { source: "iana" },
  "application/vnd.pawaafile": { source: "iana", extensions: ["paw"] },
  "application/vnd.pcos": { source: "iana" },
  "application/vnd.pg.format": { source: "iana", extensions: ["str"] },
  "application/vnd.pg.osasli": { source: "iana", extensions: ["ei6"] },
  "application/vnd.piaccess.application-licence": { source: "iana" },
  "application/vnd.picsel": { source: "iana", extensions: ["efif"] },
  "application/vnd.pmi.widget": { source: "iana", extensions: ["wg"] },
  "application/vnd.poc.group-advertisement+xml": { source: "iana", compressible: !0 },
  "application/vnd.pocketlearn": { source: "iana", extensions: ["plf"] },
  "application/vnd.powerbuilder6": { source: "iana", extensions: ["pbd"] },
  "application/vnd.powerbuilder6-s": { source: "iana" },
  "application/vnd.powerbuilder7": { source: "iana" },
  "application/vnd.powerbuilder7-s": { source: "iana" },
  "application/vnd.powerbuilder75": { source: "iana" },
  "application/vnd.powerbuilder75-s": { source: "iana" },
  "application/vnd.preminet": { source: "iana" },
  "application/vnd.previewsystems.box": { source: "iana", extensions: ["box"] },
  "application/vnd.proteus.magazine": { source: "iana", extensions: ["mgz"] },
  "application/vnd.psfs": { source: "iana" },
  "application/vnd.publishare-delta-tree": { source: "iana", extensions: ["qps"] },
  "application/vnd.pvi.ptid1": { source: "iana", extensions: ["ptid"] },
  "application/vnd.pwg-multiplexed": { source: "iana" },
  "application/vnd.pwg-xhtml-print+xml": { source: "iana", compressible: !0 },
  "application/vnd.qualcomm.brew-app-res": { source: "iana" },
  "application/vnd.quarantainenet": { source: "iana" },
  "application/vnd.quark.quarkxpress": { source: "iana", extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"] },
  "application/vnd.quobject-quoxdocument": { source: "iana" },
  "application/vnd.radisys.moml+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-conf+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-conn+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-dialog+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-audit-stream+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-conf+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-base+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-group+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-speech+xml": { source: "iana", compressible: !0 },
  "application/vnd.radisys.msml-dialog-transform+xml": { source: "iana", compressible: !0 },
  "application/vnd.rainstor.data": { source: "iana" },
  "application/vnd.rapid": { source: "iana" },
  "application/vnd.rar": { source: "iana", extensions: ["rar"] },
  "application/vnd.realvnc.bed": { source: "iana", extensions: ["bed"] },
  "application/vnd.recordare.musicxml": { source: "iana", extensions: ["mxl"] },
  "application/vnd.recordare.musicxml+xml": { source: "iana", compressible: !0, extensions: ["musicxml"] },
  "application/vnd.renlearn.rlprint": { source: "iana" },
  "application/vnd.resilient.logic": { source: "iana" },
  "application/vnd.restful+json": { source: "iana", compressible: !0 },
  "application/vnd.rig.cryptonote": { source: "iana", extensions: ["cryptonote"] },
  "application/vnd.rim.cod": { source: "apache", extensions: ["cod"] },
  "application/vnd.rn-realmedia": { source: "apache", extensions: ["rm"] },
  "application/vnd.rn-realmedia-vbr": { source: "apache", extensions: ["rmvb"] },
  "application/vnd.route66.link66+xml": { source: "iana", compressible: !0, extensions: ["link66"] },
  "application/vnd.rs-274x": { source: "iana" },
  "application/vnd.ruckus.download": { source: "iana" },
  "application/vnd.s3sms": { source: "iana" },
  "application/vnd.sailingtracker.track": { source: "iana", extensions: ["st"] },
  "application/vnd.sar": { source: "iana" },
  "application/vnd.sbm.cid": { source: "iana" },
  "application/vnd.sbm.mid2": { source: "iana" },
  "application/vnd.scribus": { source: "iana" },
  "application/vnd.sealed.3df": { source: "iana" },
  "application/vnd.sealed.csf": { source: "iana" },
  "application/vnd.sealed.doc": { source: "iana" },
  "application/vnd.sealed.eml": { source: "iana" },
  "application/vnd.sealed.mht": { source: "iana" },
  "application/vnd.sealed.net": { source: "iana" },
  "application/vnd.sealed.ppt": { source: "iana" },
  "application/vnd.sealed.tiff": { source: "iana" },
  "application/vnd.sealed.xls": { source: "iana" },
  "application/vnd.sealedmedia.softseal.html": { source: "iana" },
  "application/vnd.sealedmedia.softseal.pdf": { source: "iana" },
  "application/vnd.seemail": { source: "iana", extensions: ["see"] },
  "application/vnd.seis+json": { source: "iana", compressible: !0 },
  "application/vnd.sema": { source: "iana", extensions: ["sema"] },
  "application/vnd.semd": { source: "iana", extensions: ["semd"] },
  "application/vnd.semf": { source: "iana", extensions: ["semf"] },
  "application/vnd.shade-save-file": { source: "iana" },
  "application/vnd.shana.informed.formdata": { source: "iana", extensions: ["ifm"] },
  "application/vnd.shana.informed.formtemplate": { source: "iana", extensions: ["itp"] },
  "application/vnd.shana.informed.interchange": { source: "iana", extensions: ["iif"] },
  "application/vnd.shana.informed.package": { source: "iana", extensions: ["ipk"] },
  "application/vnd.shootproof+json": { source: "iana", compressible: !0 },
  "application/vnd.shopkick+json": { source: "iana", compressible: !0 },
  "application/vnd.shp": { source: "iana" },
  "application/vnd.shx": { source: "iana" },
  "application/vnd.sigrok.session": { source: "iana" },
  "application/vnd.simtech-mindmapper": { source: "iana", extensions: ["twd", "twds"] },
  "application/vnd.siren+json": { source: "iana", compressible: !0 },
  "application/vnd.smaf": { source: "iana", extensions: ["mmf"] },
  "application/vnd.smart.notebook": { source: "iana" },
  "application/vnd.smart.teacher": { source: "iana", extensions: ["teacher"] },
  "application/vnd.snesdev-page-table": { source: "iana" },
  "application/vnd.software602.filler.form+xml": { source: "iana", compressible: !0, extensions: ["fo"] },
  "application/vnd.software602.filler.form-xml-zip": { source: "iana" },
  "application/vnd.solent.sdkm+xml": { source: "iana", compressible: !0, extensions: ["sdkm", "sdkd"] },
  "application/vnd.spotfire.dxp": { source: "iana", extensions: ["dxp"] },
  "application/vnd.spotfire.sfs": { source: "iana", extensions: ["sfs"] },
  "application/vnd.sqlite3": { source: "iana" },
  "application/vnd.sss-cod": { source: "iana" },
  "application/vnd.sss-dtf": { source: "iana" },
  "application/vnd.sss-ntf": { source: "iana" },
  "application/vnd.stardivision.calc": { source: "apache", extensions: ["sdc"] },
  "application/vnd.stardivision.draw": { source: "apache", extensions: ["sda"] },
  "application/vnd.stardivision.impress": { source: "apache", extensions: ["sdd"] },
  "application/vnd.stardivision.math": { source: "apache", extensions: ["smf"] },
  "application/vnd.stardivision.writer": { source: "apache", extensions: ["sdw", "vor"] },
  "application/vnd.stardivision.writer-global": { source: "apache", extensions: ["sgl"] },
  "application/vnd.stepmania.package": { source: "iana", extensions: ["smzip"] },
  "application/vnd.stepmania.stepchart": { source: "iana", extensions: ["sm"] },
  "application/vnd.street-stream": { source: "iana" },
  "application/vnd.sun.wadl+xml": { source: "iana", compressible: !0, extensions: ["wadl"] },
  "application/vnd.sun.xml.calc": { source: "apache", extensions: ["sxc"] },
  "application/vnd.sun.xml.calc.template": { source: "apache", extensions: ["stc"] },
  "application/vnd.sun.xml.draw": { source: "apache", extensions: ["sxd"] },
  "application/vnd.sun.xml.draw.template": { source: "apache", extensions: ["std"] },
  "application/vnd.sun.xml.impress": { source: "apache", extensions: ["sxi"] },
  "application/vnd.sun.xml.impress.template": { source: "apache", extensions: ["sti"] },
  "application/vnd.sun.xml.math": { source: "apache", extensions: ["sxm"] },
  "application/vnd.sun.xml.writer": { source: "apache", extensions: ["sxw"] },
  "application/vnd.sun.xml.writer.global": { source: "apache", extensions: ["sxg"] },
  "application/vnd.sun.xml.writer.template": { source: "apache", extensions: ["stw"] },
  "application/vnd.sus-calendar": { source: "iana", extensions: ["sus", "susp"] },
  "application/vnd.svd": { source: "iana", extensions: ["svd"] },
  "application/vnd.swiftview-ics": { source: "iana" },
  "application/vnd.sycle+xml": { source: "iana", compressible: !0 },
  "application/vnd.syft+json": { source: "iana", compressible: !0 },
  "application/vnd.symbian.install": { source: "apache", extensions: ["sis", "sisx"] },
  "application/vnd.syncml+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["xsm"] },
  "application/vnd.syncml.dm+wbxml": { source: "iana", charset: "UTF-8", extensions: ["bdm"] },
  "application/vnd.syncml.dm+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["xdm"] },
  "application/vnd.syncml.dm.notification": { source: "iana" },
  "application/vnd.syncml.dmddf+wbxml": { source: "iana" },
  "application/vnd.syncml.dmddf+xml": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["ddf"] },
  "application/vnd.syncml.dmtnds+wbxml": { source: "iana" },
  "application/vnd.syncml.dmtnds+xml": { source: "iana", charset: "UTF-8", compressible: !0 },
  "application/vnd.syncml.ds.notification": { source: "iana" },
  "application/vnd.tableschema+json": { source: "iana", compressible: !0 },
  "application/vnd.tao.intent-module-archive": { source: "iana", extensions: ["tao"] },
  "application/vnd.tcpdump.pcap": { source: "iana", extensions: ["pcap", "cap", "dmp"] },
  "application/vnd.think-cell.ppttc+json": { source: "iana", compressible: !0 },
  "application/vnd.tmd.mediaflex.api+xml": { source: "iana", compressible: !0 },
  "application/vnd.tml": { source: "iana" },
  "application/vnd.tmobile-livetv": { source: "iana", extensions: ["tmo"] },
  "application/vnd.tri.onesource": { source: "iana" },
  "application/vnd.trid.tpt": { source: "iana", extensions: ["tpt"] },
  "application/vnd.triscape.mxs": { source: "iana", extensions: ["mxs"] },
  "application/vnd.trueapp": { source: "iana", extensions: ["tra"] },
  "application/vnd.truedoc": { source: "iana" },
  "application/vnd.ubisoft.webplayer": { source: "iana" },
  "application/vnd.ufdl": { source: "iana", extensions: ["ufd", "ufdl"] },
  "application/vnd.uiq.theme": { source: "iana", extensions: ["utz"] },
  "application/vnd.umajin": { source: "iana", extensions: ["umj"] },
  "application/vnd.unity": { source: "iana", extensions: ["unityweb"] },
  "application/vnd.uoml+xml": { source: "iana", compressible: !0, extensions: ["uoml"] },
  "application/vnd.uplanet.alert": { source: "iana" },
  "application/vnd.uplanet.alert-wbxml": { source: "iana" },
  "application/vnd.uplanet.bearer-choice": { source: "iana" },
  "application/vnd.uplanet.bearer-choice-wbxml": { source: "iana" },
  "application/vnd.uplanet.cacheop": { source: "iana" },
  "application/vnd.uplanet.cacheop-wbxml": { source: "iana" },
  "application/vnd.uplanet.channel": { source: "iana" },
  "application/vnd.uplanet.channel-wbxml": { source: "iana" },
  "application/vnd.uplanet.list": { source: "iana" },
  "application/vnd.uplanet.list-wbxml": { source: "iana" },
  "application/vnd.uplanet.listcmd": { source: "iana" },
  "application/vnd.uplanet.listcmd-wbxml": { source: "iana" },
  "application/vnd.uplanet.signal": { source: "iana" },
  "application/vnd.uri-map": { source: "iana" },
  "application/vnd.valve.source.material": { source: "iana" },
  "application/vnd.vcx": { source: "iana", extensions: ["vcx"] },
  "application/vnd.vd-study": { source: "iana" },
  "application/vnd.vectorworks": { source: "iana" },
  "application/vnd.vel+json": { source: "iana", compressible: !0 },
  "application/vnd.verimatrix.vcas": { source: "iana" },
  "application/vnd.veritone.aion+json": { source: "iana", compressible: !0 },
  "application/vnd.veryant.thin": { source: "iana" },
  "application/vnd.ves.encrypted": { source: "iana" },
  "application/vnd.vidsoft.vidconference": { source: "iana" },
  "application/vnd.visio": { source: "iana", extensions: ["vsd", "vst", "vss", "vsw"] },
  "application/vnd.visionary": { source: "iana", extensions: ["vis"] },
  "application/vnd.vividence.scriptfile": { source: "iana" },
  "application/vnd.vsf": { source: "iana", extensions: ["vsf"] },
  "application/vnd.wap.sic": { source: "iana" },
  "application/vnd.wap.slc": { source: "iana" },
  "application/vnd.wap.wbxml": { source: "iana", charset: "UTF-8", extensions: ["wbxml"] },
  "application/vnd.wap.wmlc": { source: "iana", extensions: ["wmlc"] },
  "application/vnd.wap.wmlscriptc": { source: "iana", extensions: ["wmlsc"] },
  "application/vnd.webturbo": { source: "iana", extensions: ["wtb"] },
  "application/vnd.wfa.dpp": { source: "iana" },
  "application/vnd.wfa.p2p": { source: "iana" },
  "application/vnd.wfa.wsc": { source: "iana" },
  "application/vnd.windows.devicepairing": { source: "iana" },
  "application/vnd.wmc": { source: "iana" },
  "application/vnd.wmf.bootstrap": { source: "iana" },
  "application/vnd.wolfram.mathematica": { source: "iana" },
  "application/vnd.wolfram.mathematica.package": { source: "iana" },
  "application/vnd.wolfram.player": { source: "iana", extensions: ["nbp"] },
  "application/vnd.wordperfect": { source: "iana", extensions: ["wpd"] },
  "application/vnd.wqd": { source: "iana", extensions: ["wqd"] },
  "application/vnd.wrq-hp3000-labelled": { source: "iana" },
  "application/vnd.wt.stf": { source: "iana", extensions: ["stf"] },
  "application/vnd.wv.csp+wbxml": { source: "iana" },
  "application/vnd.wv.csp+xml": { source: "iana", compressible: !0 },
  "application/vnd.wv.ssp+xml": { source: "iana", compressible: !0 },
  "application/vnd.xacml+json": { source: "iana", compressible: !0 },
  "application/vnd.xara": { source: "iana", extensions: ["xar"] },
  "application/vnd.xfdl": { source: "iana", extensions: ["xfdl"] },
  "application/vnd.xfdl.webform": { source: "iana" },
  "application/vnd.xmi+xml": { source: "iana", compressible: !0 },
  "application/vnd.xmpie.cpkg": { source: "iana" },
  "application/vnd.xmpie.dpkg": { source: "iana" },
  "application/vnd.xmpie.plan": { source: "iana" },
  "application/vnd.xmpie.ppkg": { source: "iana" },
  "application/vnd.xmpie.xlim": { source: "iana" },
  "application/vnd.yamaha.hv-dic": { source: "iana", extensions: ["hvd"] },
  "application/vnd.yamaha.hv-script": { source: "iana", extensions: ["hvs"] },
  "application/vnd.yamaha.hv-voice": { source: "iana", extensions: ["hvp"] },
  "application/vnd.yamaha.openscoreformat": { source: "iana", extensions: ["osf"] },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": { source: "iana", compressible: !0, extensions: ["osfpvg"] },
  "application/vnd.yamaha.remote-setup": { source: "iana" },
  "application/vnd.yamaha.smaf-audio": { source: "iana", extensions: ["saf"] },
  "application/vnd.yamaha.smaf-phrase": { source: "iana", extensions: ["spf"] },
  "application/vnd.yamaha.through-ngn": { source: "iana" },
  "application/vnd.yamaha.tunnel-udpencap": { source: "iana" },
  "application/vnd.yaoweme": { source: "iana" },
  "application/vnd.yellowriver-custom-menu": { source: "iana", extensions: ["cmp"] },
  "application/vnd.youtube.yt": { source: "iana" },
  "application/vnd.zul": { source: "iana", extensions: ["zir", "zirz"] },
  "application/vnd.zzazz.deck+xml": { source: "iana", compressible: !0, extensions: ["zaz"] },
  "application/voicexml+xml": { source: "iana", compressible: !0, extensions: ["vxml"] },
  "application/voucher-cms+json": { source: "iana", compressible: !0 },
  "application/vq-rtcpxr": { source: "iana" },
  "application/wasm": { source: "iana", compressible: !0, extensions: ["wasm"] },
  "application/watcherinfo+xml": { source: "iana", compressible: !0, extensions: ["wif"] },
  "application/webpush-options+json": { source: "iana", compressible: !0 },
  "application/whoispp-query": { source: "iana" },
  "application/whoispp-response": { source: "iana" },
  "application/widget": { source: "iana", extensions: ["wgt"] },
  "application/winhlp": { source: "apache", extensions: ["hlp"] },
  "application/wita": { source: "iana" },
  "application/wordperfect5.1": { source: "iana" },
  "application/wsdl+xml": { source: "iana", compressible: !0, extensions: ["wsdl"] },
  "application/wspolicy+xml": { source: "iana", compressible: !0, extensions: ["wspolicy"] },
  "application/x-7z-compressed": { source: "apache", compressible: !1, extensions: ["7z"] },
  "application/x-abiword": { source: "apache", extensions: ["abw"] },
  "application/x-ace-compressed": { source: "apache", extensions: ["ace"] },
  "application/x-amf": { source: "apache" },
  "application/x-apple-diskimage": { source: "apache", extensions: ["dmg"] },
  "application/x-arj": { compressible: !1, extensions: ["arj"] },
  "application/x-authorware-bin": { source: "apache", extensions: ["aab", "x32", "u32", "vox"] },
  "application/x-authorware-map": { source: "apache", extensions: ["aam"] },
  "application/x-authorware-seg": { source: "apache", extensions: ["aas"] },
  "application/x-bcpio": { source: "apache", extensions: ["bcpio"] },
  "application/x-bdoc": { compressible: !1, extensions: ["bdoc"] },
  "application/x-bittorrent": { source: "apache", extensions: ["torrent"] },
  "application/x-blorb": { source: "apache", extensions: ["blb", "blorb"] },
  "application/x-bzip": { source: "apache", compressible: !1, extensions: ["bz"] },
  "application/x-bzip2": { source: "apache", compressible: !1, extensions: ["bz2", "boz"] },
  "application/x-cbr": { source: "apache", extensions: ["cbr", "cba", "cbt", "cbz", "cb7"] },
  "application/x-cdlink": { source: "apache", extensions: ["vcd"] },
  "application/x-cfs-compressed": { source: "apache", extensions: ["cfs"] },
  "application/x-chat": { source: "apache", extensions: ["chat"] },
  "application/x-chess-pgn": { source: "apache", extensions: ["pgn"] },
  "application/x-chrome-extension": { extensions: ["crx"] },
  "application/x-cocoa": { source: "nginx", extensions: ["cco"] },
  "application/x-compress": { source: "apache" },
  "application/x-conference": { source: "apache", extensions: ["nsc"] },
  "application/x-cpio": { source: "apache", extensions: ["cpio"] },
  "application/x-csh": { source: "apache", extensions: ["csh"] },
  "application/x-deb": { compressible: !1 },
  "application/x-debian-package": { source: "apache", extensions: ["deb", "udeb"] },
  "application/x-dgc-compressed": { source: "apache", extensions: ["dgc"] },
  "application/x-director": { source: "apache", extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"] },
  "application/x-doom": { source: "apache", extensions: ["wad"] },
  "application/x-dtbncx+xml": { source: "apache", compressible: !0, extensions: ["ncx"] },
  "application/x-dtbook+xml": { source: "apache", compressible: !0, extensions: ["dtb"] },
  "application/x-dtbresource+xml": { source: "apache", compressible: !0, extensions: ["res"] },
  "application/x-dvi": { source: "apache", compressible: !1, extensions: ["dvi"] },
  "application/x-envoy": { source: "apache", extensions: ["evy"] },
  "application/x-eva": { source: "apache", extensions: ["eva"] },
  "application/x-font-bdf": { source: "apache", extensions: ["bdf"] },
  "application/x-font-dos": { source: "apache" },
  "application/x-font-framemaker": { source: "apache" },
  "application/x-font-ghostscript": { source: "apache", extensions: ["gsf"] },
  "application/x-font-libgrx": { source: "apache" },
  "application/x-font-linux-psf": { source: "apache", extensions: ["psf"] },
  "application/x-font-pcf": { source: "apache", extensions: ["pcf"] },
  "application/x-font-snf": { source: "apache", extensions: ["snf"] },
  "application/x-font-speedo": { source: "apache" },
  "application/x-font-sunos-news": { source: "apache" },
  "application/x-font-type1": { source: "apache", extensions: ["pfa", "pfb", "pfm", "afm"] },
  "application/x-font-vfont": { source: "apache" },
  "application/x-freearc": { source: "apache", extensions: ["arc"] },
  "application/x-futuresplash": { source: "apache", extensions: ["spl"] },
  "application/x-gca-compressed": { source: "apache", extensions: ["gca"] },
  "application/x-glulx": { source: "apache", extensions: ["ulx"] },
  "application/x-gnumeric": { source: "apache", extensions: ["gnumeric"] },
  "application/x-gramps-xml": { source: "apache", extensions: ["gramps"] },
  "application/x-gtar": { source: "apache", extensions: ["gtar"] },
  "application/x-gzip": { source: "apache" },
  "application/x-hdf": { source: "apache", extensions: ["hdf"] },
  "application/x-httpd-php": { compressible: !0, extensions: ["php"] },
  "application/x-install-instructions": { source: "apache", extensions: ["install"] },
  "application/x-iso9660-image": { source: "apache", extensions: ["iso"] },
  "application/x-iwork-keynote-sffkey": { extensions: ["key"] },
  "application/x-iwork-numbers-sffnumbers": { extensions: ["numbers"] },
  "application/x-iwork-pages-sffpages": { extensions: ["pages"] },
  "application/x-java-archive-diff": { source: "nginx", extensions: ["jardiff"] },
  "application/x-java-jnlp-file": { source: "apache", compressible: !1, extensions: ["jnlp"] },
  "application/x-javascript": { compressible: !0 },
  "application/x-keepass2": { extensions: ["kdbx"] },
  "application/x-latex": { source: "apache", compressible: !1, extensions: ["latex"] },
  "application/x-lua-bytecode": { extensions: ["luac"] },
  "application/x-lzh-compressed": { source: "apache", extensions: ["lzh", "lha"] },
  "application/x-makeself": { source: "nginx", extensions: ["run"] },
  "application/x-mie": { source: "apache", extensions: ["mie"] },
  "application/x-mobipocket-ebook": { source: "apache", extensions: ["prc", "mobi"] },
  "application/x-mpegurl": { compressible: !1 },
  "application/x-ms-application": { source: "apache", extensions: ["application"] },
  "application/x-ms-shortcut": { source: "apache", extensions: ["lnk"] },
  "application/x-ms-wmd": { source: "apache", extensions: ["wmd"] },
  "application/x-ms-wmz": { source: "apache", extensions: ["wmz"] },
  "application/x-ms-xbap": { source: "apache", extensions: ["xbap"] },
  "application/x-msaccess": { source: "apache", extensions: ["mdb"] },
  "application/x-msbinder": { source: "apache", extensions: ["obd"] },
  "application/x-mscardfile": { source: "apache", extensions: ["crd"] },
  "application/x-msclip": { source: "apache", extensions: ["clp"] },
  "application/x-msdos-program": { extensions: ["exe"] },
  "application/x-msdownload": { source: "apache", extensions: ["exe", "dll", "com", "bat", "msi"] },
  "application/x-msmediaview": { source: "apache", extensions: ["mvb", "m13", "m14"] },
  "application/x-msmetafile": { source: "apache", extensions: ["wmf", "wmz", "emf", "emz"] },
  "application/x-msmoney": { source: "apache", extensions: ["mny"] },
  "application/x-mspublisher": { source: "apache", extensions: ["pub"] },
  "application/x-msschedule": { source: "apache", extensions: ["scd"] },
  "application/x-msterminal": { source: "apache", extensions: ["trm"] },
  "application/x-mswrite": { source: "apache", extensions: ["wri"] },
  "application/x-netcdf": { source: "apache", extensions: ["nc", "cdf"] },
  "application/x-ns-proxy-autoconfig": { compressible: !0, extensions: ["pac"] },
  "application/x-nzb": { source: "apache", extensions: ["nzb"] },
  "application/x-perl": { source: "nginx", extensions: ["pl", "pm"] },
  "application/x-pilot": { source: "nginx", extensions: ["prc", "pdb"] },
  "application/x-pkcs12": { source: "apache", compressible: !1, extensions: ["p12", "pfx"] },
  "application/x-pkcs7-certificates": { source: "apache", extensions: ["p7b", "spc"] },
  "application/x-pkcs7-certreqresp": { source: "apache", extensions: ["p7r"] },
  "application/x-pki-message": { source: "iana" },
  "application/x-rar-compressed": { source: "apache", compressible: !1, extensions: ["rar"] },
  "application/x-redhat-package-manager": { source: "nginx", extensions: ["rpm"] },
  "application/x-research-info-systems": { source: "apache", extensions: ["ris"] },
  "application/x-sea": { source: "nginx", extensions: ["sea"] },
  "application/x-sh": { source: "apache", compressible: !0, extensions: ["sh"] },
  "application/x-shar": { source: "apache", extensions: ["shar"] },
  "application/x-shockwave-flash": { source: "apache", compressible: !1, extensions: ["swf"] },
  "application/x-silverlight-app": { source: "apache", extensions: ["xap"] },
  "application/x-sql": { source: "apache", extensions: ["sql"] },
  "application/x-stuffit": { source: "apache", compressible: !1, extensions: ["sit"] },
  "application/x-stuffitx": { source: "apache", extensions: ["sitx"] },
  "application/x-subrip": { source: "apache", extensions: ["srt"] },
  "application/x-sv4cpio": { source: "apache", extensions: ["sv4cpio"] },
  "application/x-sv4crc": { source: "apache", extensions: ["sv4crc"] },
  "application/x-t3vm-image": { source: "apache", extensions: ["t3"] },
  "application/x-tads": { source: "apache", extensions: ["gam"] },
  "application/x-tar": { source: "apache", compressible: !0, extensions: ["tar"] },
  "application/x-tcl": { source: "apache", extensions: ["tcl", "tk"] },
  "application/x-tex": { source: "apache", extensions: ["tex"] },
  "application/x-tex-tfm": { source: "apache", extensions: ["tfm"] },
  "application/x-texinfo": { source: "apache", extensions: ["texinfo", "texi"] },
  "application/x-tgif": { source: "apache", extensions: ["obj"] },
  "application/x-ustar": { source: "apache", extensions: ["ustar"] },
  "application/x-virtualbox-hdd": { compressible: !0, extensions: ["hdd"] },
  "application/x-virtualbox-ova": { compressible: !0, extensions: ["ova"] },
  "application/x-virtualbox-ovf": { compressible: !0, extensions: ["ovf"] },
  "application/x-virtualbox-vbox": { compressible: !0, extensions: ["vbox"] },
  "application/x-virtualbox-vbox-extpack": { compressible: !1, extensions: ["vbox-extpack"] },
  "application/x-virtualbox-vdi": { compressible: !0, extensions: ["vdi"] },
  "application/x-virtualbox-vhd": { compressible: !0, extensions: ["vhd"] },
  "application/x-virtualbox-vmdk": { compressible: !0, extensions: ["vmdk"] },
  "application/x-wais-source": { source: "apache", extensions: ["src"] },
  "application/x-web-app-manifest+json": { compressible: !0, extensions: ["webapp"] },
  "application/x-www-form-urlencoded": { source: "iana", compressible: !0 },
  "application/x-x509-ca-cert": { source: "iana", extensions: ["der", "crt", "pem"] },
  "application/x-x509-ca-ra-cert": { source: "iana" },
  "application/x-x509-next-ca-cert": { source: "iana" },
  "application/x-xfig": { source: "apache", extensions: ["fig"] },
  "application/x-xliff+xml": { source: "apache", compressible: !0, extensions: ["xlf"] },
  "application/x-xpinstall": { source: "apache", compressible: !1, extensions: ["xpi"] },
  "application/x-xz": { source: "apache", extensions: ["xz"] },
  "application/x-zmachine": { source: "apache", extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"] },
  "application/x400-bp": { source: "iana" },
  "application/xacml+xml": { source: "iana", compressible: !0 },
  "application/xaml+xml": { source: "apache", compressible: !0, extensions: ["xaml"] },
  "application/xcap-att+xml": { source: "iana", compressible: !0, extensions: ["xav"] },
  "application/xcap-caps+xml": { source: "iana", compressible: !0, extensions: ["xca"] },
  "application/xcap-diff+xml": { source: "iana", compressible: !0, extensions: ["xdf"] },
  "application/xcap-el+xml": { source: "iana", compressible: !0, extensions: ["xel"] },
  "application/xcap-error+xml": { source: "iana", compressible: !0 },
  "application/xcap-ns+xml": { source: "iana", compressible: !0, extensions: ["xns"] },
  "application/xcon-conference-info+xml": { source: "iana", compressible: !0 },
  "application/xcon-conference-info-diff+xml": { source: "iana", compressible: !0 },
  "application/xenc+xml": { source: "iana", compressible: !0, extensions: ["xenc"] },
  "application/xhtml+xml": { source: "iana", compressible: !0, extensions: ["xhtml", "xht"] },
  "application/xhtml-voice+xml": { source: "apache", compressible: !0 },
  "application/xliff+xml": { source: "iana", compressible: !0, extensions: ["xlf"] },
  "application/xml": { source: "iana", compressible: !0, extensions: ["xml", "xsl", "xsd", "rng"] },
  "application/xml-dtd": { source: "iana", compressible: !0, extensions: ["dtd"] },
  "application/xml-external-parsed-entity": { source: "iana" },
  "application/xml-patch+xml": { source: "iana", compressible: !0 },
  "application/xmpp+xml": { source: "iana", compressible: !0 },
  "application/xop+xml": { source: "iana", compressible: !0, extensions: ["xop"] },
  "application/xproc+xml": { source: "apache", compressible: !0, extensions: ["xpl"] },
  "application/xslt+xml": { source: "iana", compressible: !0, extensions: ["xsl", "xslt"] },
  "application/xspf+xml": { source: "apache", compressible: !0, extensions: ["xspf"] },
  "application/xv+xml": { source: "iana", compressible: !0, extensions: ["mxml", "xhvml", "xvml", "xvm"] },
  "application/yang": { source: "iana", extensions: ["yang"] },
  "application/yang-data+json": { source: "iana", compressible: !0 },
  "application/yang-data+xml": { source: "iana", compressible: !0 },
  "application/yang-patch+json": { source: "iana", compressible: !0 },
  "application/yang-patch+xml": { source: "iana", compressible: !0 },
  "application/yin+xml": { source: "iana", compressible: !0, extensions: ["yin"] },
  "application/zip": { source: "iana", compressible: !1, extensions: ["zip"] },
  "application/zlib": { source: "iana" },
  "application/zstd": { source: "iana" },
  "audio/1d-interleaved-parityfec": { source: "iana" },
  "audio/32kadpcm": { source: "iana" },
  "audio/3gpp": { source: "iana", compressible: !1, extensions: ["3gpp"] },
  "audio/3gpp2": { source: "iana" },
  "audio/aac": { source: "iana" },
  "audio/ac3": { source: "iana" },
  "audio/adpcm": { source: "apache", extensions: ["adp"] },
  "audio/amr": { source: "iana", extensions: ["amr"] },
  "audio/amr-wb": { source: "iana" },
  "audio/amr-wb+": { source: "iana" },
  "audio/aptx": { source: "iana" },
  "audio/asc": { source: "iana" },
  "audio/atrac-advanced-lossless": { source: "iana" },
  "audio/atrac-x": { source: "iana" },
  "audio/atrac3": { source: "iana" },
  "audio/basic": { source: "iana", compressible: !1, extensions: ["au", "snd"] },
  "audio/bv16": { source: "iana" },
  "audio/bv32": { source: "iana" },
  "audio/clearmode": { source: "iana" },
  "audio/cn": { source: "iana" },
  "audio/dat12": { source: "iana" },
  "audio/dls": { source: "iana" },
  "audio/dsr-es201108": { source: "iana" },
  "audio/dsr-es202050": { source: "iana" },
  "audio/dsr-es202211": { source: "iana" },
  "audio/dsr-es202212": { source: "iana" },
  "audio/dv": { source: "iana" },
  "audio/dvi4": { source: "iana" },
  "audio/eac3": { source: "iana" },
  "audio/encaprtp": { source: "iana" },
  "audio/evrc": { source: "iana" },
  "audio/evrc-qcp": { source: "iana" },
  "audio/evrc0": { source: "iana" },
  "audio/evrc1": { source: "iana" },
  "audio/evrcb": { source: "iana" },
  "audio/evrcb0": { source: "iana" },
  "audio/evrcb1": { source: "iana" },
  "audio/evrcnw": { source: "iana" },
  "audio/evrcnw0": { source: "iana" },
  "audio/evrcnw1": { source: "iana" },
  "audio/evrcwb": { source: "iana" },
  "audio/evrcwb0": { source: "iana" },
  "audio/evrcwb1": { source: "iana" },
  "audio/evs": { source: "iana" },
  "audio/flexfec": { source: "iana" },
  "audio/fwdred": { source: "iana" },
  "audio/g711-0": { source: "iana" },
  "audio/g719": { source: "iana" },
  "audio/g722": { source: "iana" },
  "audio/g7221": { source: "iana" },
  "audio/g723": { source: "iana" },
  "audio/g726-16": { source: "iana" },
  "audio/g726-24": { source: "iana" },
  "audio/g726-32": { source: "iana" },
  "audio/g726-40": { source: "iana" },
  "audio/g728": { source: "iana" },
  "audio/g729": { source: "iana" },
  "audio/g7291": { source: "iana" },
  "audio/g729d": { source: "iana" },
  "audio/g729e": { source: "iana" },
  "audio/gsm": { source: "iana" },
  "audio/gsm-efr": { source: "iana" },
  "audio/gsm-hr-08": { source: "iana" },
  "audio/ilbc": { source: "iana" },
  "audio/ip-mr_v2.5": { source: "iana" },
  "audio/isac": { source: "apache" },
  "audio/l16": { source: "iana" },
  "audio/l20": { source: "iana" },
  "audio/l24": { source: "iana", compressible: !1 },
  "audio/l8": { source: "iana" },
  "audio/lpc": { source: "iana" },
  "audio/melp": { source: "iana" },
  "audio/melp1200": { source: "iana" },
  "audio/melp2400": { source: "iana" },
  "audio/melp600": { source: "iana" },
  "audio/mhas": { source: "iana" },
  "audio/midi": { source: "apache", extensions: ["mid", "midi", "kar", "rmi"] },
  "audio/mobile-xmf": { source: "iana", extensions: ["mxmf"] },
  "audio/mp3": { compressible: !1, extensions: ["mp3"] },
  "audio/mp4": { source: "iana", compressible: !1, extensions: ["m4a", "mp4a"] },
  "audio/mp4a-latm": { source: "iana" },
  "audio/mpa": { source: "iana" },
  "audio/mpa-robust": { source: "iana" },
  "audio/mpeg": { source: "iana", compressible: !1, extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"] },
  "audio/mpeg4-generic": { source: "iana" },
  "audio/musepack": { source: "apache" },
  "audio/ogg": { source: "iana", compressible: !1, extensions: ["oga", "ogg", "spx", "opus"] },
  "audio/opus": { source: "iana" },
  "audio/parityfec": { source: "iana" },
  "audio/pcma": { source: "iana" },
  "audio/pcma-wb": { source: "iana" },
  "audio/pcmu": { source: "iana" },
  "audio/pcmu-wb": { source: "iana" },
  "audio/prs.sid": { source: "iana" },
  "audio/qcelp": { source: "iana" },
  "audio/raptorfec": { source: "iana" },
  "audio/red": { source: "iana" },
  "audio/rtp-enc-aescm128": { source: "iana" },
  "audio/rtp-midi": { source: "iana" },
  "audio/rtploopback": { source: "iana" },
  "audio/rtx": { source: "iana" },
  "audio/s3m": { source: "apache", extensions: ["s3m"] },
  "audio/scip": { source: "iana" },
  "audio/silk": { source: "apache", extensions: ["sil"] },
  "audio/smv": { source: "iana" },
  "audio/smv-qcp": { source: "iana" },
  "audio/smv0": { source: "iana" },
  "audio/sofa": { source: "iana" },
  "audio/sp-midi": { source: "iana" },
  "audio/speex": { source: "iana" },
  "audio/t140c": { source: "iana" },
  "audio/t38": { source: "iana" },
  "audio/telephone-event": { source: "iana" },
  "audio/tetra_acelp": { source: "iana" },
  "audio/tetra_acelp_bb": { source: "iana" },
  "audio/tone": { source: "iana" },
  "audio/tsvcis": { source: "iana" },
  "audio/uemclip": { source: "iana" },
  "audio/ulpfec": { source: "iana" },
  "audio/usac": { source: "iana" },
  "audio/vdvi": { source: "iana" },
  "audio/vmr-wb": { source: "iana" },
  "audio/vnd.3gpp.iufp": { source: "iana" },
  "audio/vnd.4sb": { source: "iana" },
  "audio/vnd.audiokoz": { source: "iana" },
  "audio/vnd.celp": { source: "iana" },
  "audio/vnd.cisco.nse": { source: "iana" },
  "audio/vnd.cmles.radio-events": { source: "iana" },
  "audio/vnd.cns.anp1": { source: "iana" },
  "audio/vnd.cns.inf1": { source: "iana" },
  "audio/vnd.dece.audio": { source: "iana", extensions: ["uva", "uvva"] },
  "audio/vnd.digital-winds": { source: "iana", extensions: ["eol"] },
  "audio/vnd.dlna.adts": { source: "iana" },
  "audio/vnd.dolby.heaac.1": { source: "iana" },
  "audio/vnd.dolby.heaac.2": { source: "iana" },
  "audio/vnd.dolby.mlp": { source: "iana" },
  "audio/vnd.dolby.mps": { source: "iana" },
  "audio/vnd.dolby.pl2": { source: "iana" },
  "audio/vnd.dolby.pl2x": { source: "iana" },
  "audio/vnd.dolby.pl2z": { source: "iana" },
  "audio/vnd.dolby.pulse.1": { source: "iana" },
  "audio/vnd.dra": { source: "iana", extensions: ["dra"] },
  "audio/vnd.dts": { source: "iana", extensions: ["dts"] },
  "audio/vnd.dts.hd": { source: "iana", extensions: ["dtshd"] },
  "audio/vnd.dts.uhd": { source: "iana" },
  "audio/vnd.dvb.file": { source: "iana" },
  "audio/vnd.everad.plj": { source: "iana" },
  "audio/vnd.hns.audio": { source: "iana" },
  "audio/vnd.lucent.voice": { source: "iana", extensions: ["lvp"] },
  "audio/vnd.ms-playready.media.pya": { source: "iana", extensions: ["pya"] },
  "audio/vnd.nokia.mobile-xmf": { source: "iana" },
  "audio/vnd.nortel.vbk": { source: "iana" },
  "audio/vnd.nuera.ecelp4800": { source: "iana", extensions: ["ecelp4800"] },
  "audio/vnd.nuera.ecelp7470": { source: "iana", extensions: ["ecelp7470"] },
  "audio/vnd.nuera.ecelp9600": { source: "iana", extensions: ["ecelp9600"] },
  "audio/vnd.octel.sbc": { source: "iana" },
  "audio/vnd.presonus.multitrack": { source: "iana" },
  "audio/vnd.qcelp": { source: "iana" },
  "audio/vnd.rhetorex.32kadpcm": { source: "iana" },
  "audio/vnd.rip": { source: "iana", extensions: ["rip"] },
  "audio/vnd.rn-realaudio": { compressible: !1 },
  "audio/vnd.sealedmedia.softseal.mpeg": { source: "iana" },
  "audio/vnd.vmx.cvsd": { source: "iana" },
  "audio/vnd.wave": { compressible: !1 },
  "audio/vorbis": { source: "iana", compressible: !1 },
  "audio/vorbis-config": { source: "iana" },
  "audio/wav": { compressible: !1, extensions: ["wav"] },
  "audio/wave": { compressible: !1, extensions: ["wav"] },
  "audio/webm": { source: "apache", compressible: !1, extensions: ["weba"] },
  "audio/x-aac": { source: "apache", compressible: !1, extensions: ["aac"] },
  "audio/x-aiff": { source: "apache", extensions: ["aif", "aiff", "aifc"] },
  "audio/x-caf": { source: "apache", compressible: !1, extensions: ["caf"] },
  "audio/x-flac": { source: "apache", extensions: ["flac"] },
  "audio/x-m4a": { source: "nginx", extensions: ["m4a"] },
  "audio/x-matroska": { source: "apache", extensions: ["mka"] },
  "audio/x-mpegurl": { source: "apache", extensions: ["m3u"] },
  "audio/x-ms-wax": { source: "apache", extensions: ["wax"] },
  "audio/x-ms-wma": { source: "apache", extensions: ["wma"] },
  "audio/x-pn-realaudio": { source: "apache", extensions: ["ram", "ra"] },
  "audio/x-pn-realaudio-plugin": { source: "apache", extensions: ["rmp"] },
  "audio/x-realaudio": { source: "nginx", extensions: ["ra"] },
  "audio/x-tta": { source: "apache" },
  "audio/x-wav": { source: "apache", extensions: ["wav"] },
  "audio/xm": { source: "apache", extensions: ["xm"] },
  "chemical/x-cdx": { source: "apache", extensions: ["cdx"] },
  "chemical/x-cif": { source: "apache", extensions: ["cif"] },
  "chemical/x-cmdf": { source: "apache", extensions: ["cmdf"] },
  "chemical/x-cml": { source: "apache", extensions: ["cml"] },
  "chemical/x-csml": { source: "apache", extensions: ["csml"] },
  "chemical/x-pdb": { source: "apache" },
  "chemical/x-xyz": { source: "apache", extensions: ["xyz"] },
  "font/collection": { source: "iana", extensions: ["ttc"] },
  "font/otf": { source: "iana", compressible: !0, extensions: ["otf"] },
  "font/sfnt": { source: "iana" },
  "font/ttf": { source: "iana", compressible: !0, extensions: ["ttf"] },
  "font/woff": { source: "iana", extensions: ["woff"] },
  "font/woff2": { source: "iana", extensions: ["woff2"] },
  "image/aces": { source: "iana", extensions: ["exr"] },
  "image/apng": { compressible: !1, extensions: ["apng"] },
  "image/avci": { source: "iana", extensions: ["avci"] },
  "image/avcs": { source: "iana", extensions: ["avcs"] },
  "image/avif": { source: "iana", compressible: !1, extensions: ["avif"] },
  "image/bmp": { source: "iana", compressible: !0, extensions: ["bmp"] },
  "image/cgm": { source: "iana", extensions: ["cgm"] },
  "image/dicom-rle": { source: "iana", extensions: ["drle"] },
  "image/emf": { source: "iana", extensions: ["emf"] },
  "image/fits": { source: "iana", extensions: ["fits"] },
  "image/g3fax": { source: "iana", extensions: ["g3"] },
  "image/gif": { source: "iana", compressible: !1, extensions: ["gif"] },
  "image/heic": { source: "iana", extensions: ["heic"] },
  "image/heic-sequence": { source: "iana", extensions: ["heics"] },
  "image/heif": { source: "iana", extensions: ["heif"] },
  "image/heif-sequence": { source: "iana", extensions: ["heifs"] },
  "image/hej2k": { source: "iana", extensions: ["hej2"] },
  "image/hsj2": { source: "iana", extensions: ["hsj2"] },
  "image/ief": { source: "iana", extensions: ["ief"] },
  "image/jls": { source: "iana", extensions: ["jls"] },
  "image/jp2": { source: "iana", compressible: !1, extensions: ["jp2", "jpg2"] },
  "image/jpeg": { source: "iana", compressible: !1, extensions: ["jpeg", "jpg", "jpe"] },
  "image/jph": { source: "iana", extensions: ["jph"] },
  "image/jphc": { source: "iana", extensions: ["jhc"] },
  "image/jpm": { source: "iana", compressible: !1, extensions: ["jpm"] },
  "image/jpx": { source: "iana", compressible: !1, extensions: ["jpx", "jpf"] },
  "image/jxr": { source: "iana", extensions: ["jxr"] },
  "image/jxra": { source: "iana", extensions: ["jxra"] },
  "image/jxrs": { source: "iana", extensions: ["jxrs"] },
  "image/jxs": { source: "iana", extensions: ["jxs"] },
  "image/jxsc": { source: "iana", extensions: ["jxsc"] },
  "image/jxsi": { source: "iana", extensions: ["jxsi"] },
  "image/jxss": { source: "iana", extensions: ["jxss"] },
  "image/ktx": { source: "iana", extensions: ["ktx"] },
  "image/ktx2": { source: "iana", extensions: ["ktx2"] },
  "image/naplps": { source: "iana" },
  "image/pjpeg": { compressible: !1 },
  "image/png": { source: "iana", compressible: !1, extensions: ["png"] },
  "image/prs.btif": { source: "iana", extensions: ["btif"] },
  "image/prs.pti": { source: "iana", extensions: ["pti"] },
  "image/pwg-raster": { source: "iana" },
  "image/sgi": { source: "apache", extensions: ["sgi"] },
  "image/svg+xml": { source: "iana", compressible: !0, extensions: ["svg", "svgz"] },
  "image/t38": { source: "iana", extensions: ["t38"] },
  "image/tiff": { source: "iana", compressible: !1, extensions: ["tif", "tiff"] },
  "image/tiff-fx": { source: "iana", extensions: ["tfx"] },
  "image/vnd.adobe.photoshop": { source: "iana", compressible: !0, extensions: ["psd"] },
  "image/vnd.airzip.accelerator.azv": { source: "iana", extensions: ["azv"] },
  "image/vnd.cns.inf2": { source: "iana" },
  "image/vnd.dece.graphic": { source: "iana", extensions: ["uvi", "uvvi", "uvg", "uvvg"] },
  "image/vnd.djvu": { source: "iana", extensions: ["djvu", "djv"] },
  "image/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
  "image/vnd.dwg": { source: "iana", extensions: ["dwg"] },
  "image/vnd.dxf": { source: "iana", extensions: ["dxf"] },
  "image/vnd.fastbidsheet": { source: "iana", extensions: ["fbs"] },
  "image/vnd.fpx": { source: "iana", extensions: ["fpx"] },
  "image/vnd.fst": { source: "iana", extensions: ["fst"] },
  "image/vnd.fujixerox.edmics-mmr": { source: "iana", extensions: ["mmr"] },
  "image/vnd.fujixerox.edmics-rlc": { source: "iana", extensions: ["rlc"] },
  "image/vnd.globalgraphics.pgb": { source: "iana" },
  "image/vnd.microsoft.icon": { source: "iana", compressible: !0, extensions: ["ico"] },
  "image/vnd.mix": { source: "iana" },
  "image/vnd.mozilla.apng": { source: "iana" },
  "image/vnd.ms-dds": { compressible: !0, extensions: ["dds"] },
  "image/vnd.ms-modi": { source: "iana", extensions: ["mdi"] },
  "image/vnd.ms-photo": { source: "apache", extensions: ["wdp"] },
  "image/vnd.net-fpx": { source: "iana", extensions: ["npx"] },
  "image/vnd.pco.b16": { source: "iana", extensions: ["b16"] },
  "image/vnd.radiance": { source: "iana" },
  "image/vnd.sealed.png": { source: "iana" },
  "image/vnd.sealedmedia.softseal.gif": { source: "iana" },
  "image/vnd.sealedmedia.softseal.jpg": { source: "iana" },
  "image/vnd.svf": { source: "iana" },
  "image/vnd.tencent.tap": { source: "iana", extensions: ["tap"] },
  "image/vnd.valve.source.texture": { source: "iana", extensions: ["vtf"] },
  "image/vnd.wap.wbmp": { source: "iana", extensions: ["wbmp"] },
  "image/vnd.xiff": { source: "iana", extensions: ["xif"] },
  "image/vnd.zbrush.pcx": { source: "iana", extensions: ["pcx"] },
  "image/webp": { source: "apache", extensions: ["webp"] },
  "image/wmf": { source: "iana", extensions: ["wmf"] },
  "image/x-3ds": { source: "apache", extensions: ["3ds"] },
  "image/x-cmu-raster": { source: "apache", extensions: ["ras"] },
  "image/x-cmx": { source: "apache", extensions: ["cmx"] },
  "image/x-freehand": { source: "apache", extensions: ["fh", "fhc", "fh4", "fh5", "fh7"] },
  "image/x-icon": { source: "apache", compressible: !0, extensions: ["ico"] },
  "image/x-jng": { source: "nginx", extensions: ["jng"] },
  "image/x-mrsid-image": { source: "apache", extensions: ["sid"] },
  "image/x-ms-bmp": { source: "nginx", compressible: !0, extensions: ["bmp"] },
  "image/x-pcx": { source: "apache", extensions: ["pcx"] },
  "image/x-pict": { source: "apache", extensions: ["pic", "pct"] },
  "image/x-portable-anymap": { source: "apache", extensions: ["pnm"] },
  "image/x-portable-bitmap": { source: "apache", extensions: ["pbm"] },
  "image/x-portable-graymap": { source: "apache", extensions: ["pgm"] },
  "image/x-portable-pixmap": { source: "apache", extensions: ["ppm"] },
  "image/x-rgb": { source: "apache", extensions: ["rgb"] },
  "image/x-tga": { source: "apache", extensions: ["tga"] },
  "image/x-xbitmap": { source: "apache", extensions: ["xbm"] },
  "image/x-xcf": { compressible: !1 },
  "image/x-xpixmap": { source: "apache", extensions: ["xpm"] },
  "image/x-xwindowdump": { source: "apache", extensions: ["xwd"] },
  "message/cpim": { source: "iana" },
  "message/delivery-status": { source: "iana" },
  "message/disposition-notification": { source: "iana", extensions: ["disposition-notification"] },
  "message/external-body": { source: "iana" },
  "message/feedback-report": { source: "iana" },
  "message/global": { source: "iana", extensions: ["u8msg"] },
  "message/global-delivery-status": { source: "iana", extensions: ["u8dsn"] },
  "message/global-disposition-notification": { source: "iana", extensions: ["u8mdn"] },
  "message/global-headers": { source: "iana", extensions: ["u8hdr"] },
  "message/http": { source: "iana", compressible: !1 },
  "message/imdn+xml": { source: "iana", compressible: !0 },
  "message/news": { source: "iana" },
  "message/partial": { source: "iana", compressible: !1 },
  "message/rfc822": { source: "iana", compressible: !0, extensions: ["eml", "mime"] },
  "message/s-http": { source: "iana" },
  "message/sip": { source: "iana" },
  "message/sipfrag": { source: "iana" },
  "message/tracking-status": { source: "iana" },
  "message/vnd.si.simp": { source: "iana" },
  "message/vnd.wfa.wsc": { source: "iana", extensions: ["wsc"] },
  "model/3mf": { source: "iana", extensions: ["3mf"] },
  "model/e57": { source: "iana" },
  "model/gltf+json": { source: "iana", compressible: !0, extensions: ["gltf"] },
  "model/gltf-binary": { source: "iana", compressible: !0, extensions: ["glb"] },
  "model/iges": { source: "iana", compressible: !1, extensions: ["igs", "iges"] },
  "model/mesh": { source: "iana", compressible: !1, extensions: ["msh", "mesh", "silo"] },
  "model/mtl": { source: "iana", extensions: ["mtl"] },
  "model/obj": { source: "iana", extensions: ["obj"] },
  "model/step": { source: "iana" },
  "model/step+xml": { source: "iana", compressible: !0, extensions: ["stpx"] },
  "model/step+zip": { source: "iana", compressible: !1, extensions: ["stpz"] },
  "model/step-xml+zip": { source: "iana", compressible: !1, extensions: ["stpxz"] },
  "model/stl": { source: "iana", extensions: ["stl"] },
  "model/vnd.collada+xml": { source: "iana", compressible: !0, extensions: ["dae"] },
  "model/vnd.dwf": { source: "iana", extensions: ["dwf"] },
  "model/vnd.flatland.3dml": { source: "iana" },
  "model/vnd.gdl": { source: "iana", extensions: ["gdl"] },
  "model/vnd.gs-gdl": { source: "apache" },
  "model/vnd.gs.gdl": { source: "iana" },
  "model/vnd.gtw": { source: "iana", extensions: ["gtw"] },
  "model/vnd.moml+xml": { source: "iana", compressible: !0 },
  "model/vnd.mts": { source: "iana", extensions: ["mts"] },
  "model/vnd.opengex": { source: "iana", extensions: ["ogex"] },
  "model/vnd.parasolid.transmit.binary": { source: "iana", extensions: ["x_b"] },
  "model/vnd.parasolid.transmit.text": { source: "iana", extensions: ["x_t"] },
  "model/vnd.pytha.pyox": { source: "iana" },
  "model/vnd.rosette.annotated-data-model": { source: "iana" },
  "model/vnd.sap.vds": { source: "iana", extensions: ["vds"] },
  "model/vnd.usdz+zip": { source: "iana", compressible: !1, extensions: ["usdz"] },
  "model/vnd.valve.source.compiled-map": { source: "iana", extensions: ["bsp"] },
  "model/vnd.vtu": { source: "iana", extensions: ["vtu"] },
  "model/vrml": { source: "iana", compressible: !1, extensions: ["wrl", "vrml"] },
  "model/x3d+binary": { source: "apache", compressible: !1, extensions: ["x3db", "x3dbz"] },
  "model/x3d+fastinfoset": { source: "iana", extensions: ["x3db"] },
  "model/x3d+vrml": { source: "apache", compressible: !1, extensions: ["x3dv", "x3dvz"] },
  "model/x3d+xml": { source: "iana", compressible: !0, extensions: ["x3d", "x3dz"] },
  "model/x3d-vrml": { source: "iana", extensions: ["x3dv"] },
  "multipart/alternative": { source: "iana", compressible: !1 },
  "multipart/appledouble": { source: "iana" },
  "multipart/byteranges": { source: "iana" },
  "multipart/digest": { source: "iana" },
  "multipart/encrypted": { source: "iana", compressible: !1 },
  "multipart/form-data": { source: "iana", compressible: !1 },
  "multipart/header-set": { source: "iana" },
  "multipart/mixed": { source: "iana" },
  "multipart/multilingual": { source: "iana" },
  "multipart/parallel": { source: "iana" },
  "multipart/related": { source: "iana", compressible: !1 },
  "multipart/report": { source: "iana" },
  "multipart/signed": { source: "iana", compressible: !1 },
  "multipart/vnd.bint.med-plus": { source: "iana" },
  "multipart/voice-message": { source: "iana" },
  "multipart/x-mixed-replace": { source: "iana" },
  "text/1d-interleaved-parityfec": { source: "iana" },
  "text/cache-manifest": { source: "iana", compressible: !0, extensions: ["appcache", "manifest"] },
  "text/calendar": { source: "iana", extensions: ["ics", "ifb"] },
  "text/calender": { compressible: !0 },
  "text/cmd": { compressible: !0 },
  "text/coffeescript": { extensions: ["coffee", "litcoffee"] },
  "text/cql": { source: "iana" },
  "text/cql-expression": { source: "iana" },
  "text/cql-identifier": { source: "iana" },
  "text/css": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["css"] },
  "text/csv": { source: "iana", compressible: !0, extensions: ["csv"] },
  "text/csv-schema": { source: "iana" },
  "text/directory": { source: "iana" },
  "text/dns": { source: "iana" },
  "text/ecmascript": { source: "iana" },
  "text/encaprtp": { source: "iana" },
  "text/enriched": { source: "iana" },
  "text/fhirpath": { source: "iana" },
  "text/flexfec": { source: "iana" },
  "text/fwdred": { source: "iana" },
  "text/gff3": { source: "iana" },
  "text/grammar-ref-list": { source: "iana" },
  "text/html": { source: "iana", compressible: !0, extensions: ["html", "htm", "shtml"] },
  "text/jade": { extensions: ["jade"] },
  "text/javascript": { source: "iana", compressible: !0 },
  "text/jcr-cnd": { source: "iana" },
  "text/jsx": { compressible: !0, extensions: ["jsx"] },
  "text/less": { compressible: !0, extensions: ["less"] },
  "text/markdown": { source: "iana", compressible: !0, extensions: ["markdown", "md"] },
  "text/mathml": { source: "nginx", extensions: ["mml"] },
  "text/mdx": { compressible: !0, extensions: ["mdx"] },
  "text/mizar": { source: "iana" },
  "text/n3": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["n3"] },
  "text/parameters": { source: "iana", charset: "UTF-8" },
  "text/parityfec": { source: "iana" },
  "text/plain": { source: "iana", compressible: !0, extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"] },
  "text/provenance-notation": { source: "iana", charset: "UTF-8" },
  "text/prs.fallenstein.rst": { source: "iana" },
  "text/prs.lines.tag": { source: "iana", extensions: ["dsc"] },
  "text/prs.prop.logic": { source: "iana" },
  "text/raptorfec": { source: "iana" },
  "text/red": { source: "iana" },
  "text/rfc822-headers": { source: "iana" },
  "text/richtext": { source: "iana", compressible: !0, extensions: ["rtx"] },
  "text/rtf": { source: "iana", compressible: !0, extensions: ["rtf"] },
  "text/rtp-enc-aescm128": { source: "iana" },
  "text/rtploopback": { source: "iana" },
  "text/rtx": { source: "iana" },
  "text/sgml": { source: "iana", extensions: ["sgml", "sgm"] },
  "text/shaclc": { source: "iana" },
  "text/shex": { source: "iana", extensions: ["shex"] },
  "text/slim": { extensions: ["slim", "slm"] },
  "text/spdx": { source: "iana", extensions: ["spdx"] },
  "text/strings": { source: "iana" },
  "text/stylus": { extensions: ["stylus", "styl"] },
  "text/t140": { source: "iana" },
  "text/tab-separated-values": { source: "iana", compressible: !0, extensions: ["tsv"] },
  "text/troff": { source: "iana", extensions: ["t", "tr", "roff", "man", "me", "ms"] },
  "text/turtle": { source: "iana", charset: "UTF-8", extensions: ["ttl"] },
  "text/ulpfec": { source: "iana" },
  "text/uri-list": { source: "iana", compressible: !0, extensions: ["uri", "uris", "urls"] },
  "text/vcard": { source: "iana", compressible: !0, extensions: ["vcard"] },
  "text/vnd.a": { source: "iana" },
  "text/vnd.abc": { source: "iana" },
  "text/vnd.ascii-art": { source: "iana" },
  "text/vnd.curl": { source: "iana", extensions: ["curl"] },
  "text/vnd.curl.dcurl": { source: "apache", extensions: ["dcurl"] },
  "text/vnd.curl.mcurl": { source: "apache", extensions: ["mcurl"] },
  "text/vnd.curl.scurl": { source: "apache", extensions: ["scurl"] },
  "text/vnd.debian.copyright": { source: "iana", charset: "UTF-8" },
  "text/vnd.dmclientscript": { source: "iana" },
  "text/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
  "text/vnd.esmertec.theme-descriptor": { source: "iana", charset: "UTF-8" },
  "text/vnd.familysearch.gedcom": { source: "iana", extensions: ["ged"] },
  "text/vnd.ficlab.flt": { source: "iana" },
  "text/vnd.fly": { source: "iana", extensions: ["fly"] },
  "text/vnd.fmi.flexstor": { source: "iana", extensions: ["flx"] },
  "text/vnd.gml": { source: "iana" },
  "text/vnd.graphviz": { source: "iana", extensions: ["gv"] },
  "text/vnd.hans": { source: "iana" },
  "text/vnd.hgl": { source: "iana" },
  "text/vnd.in3d.3dml": { source: "iana", extensions: ["3dml"] },
  "text/vnd.in3d.spot": { source: "iana", extensions: ["spot"] },
  "text/vnd.iptc.newsml": { source: "iana" },
  "text/vnd.iptc.nitf": { source: "iana" },
  "text/vnd.latex-z": { source: "iana" },
  "text/vnd.motorola.reflex": { source: "iana" },
  "text/vnd.ms-mediapackage": { source: "iana" },
  "text/vnd.net2phone.commcenter.command": { source: "iana" },
  "text/vnd.radisys.msml-basic-layout": { source: "iana" },
  "text/vnd.senx.warpscript": { source: "iana" },
  "text/vnd.si.uricatalogue": { source: "iana" },
  "text/vnd.sosi": { source: "iana" },
  "text/vnd.sun.j2me.app-descriptor": { source: "iana", charset: "UTF-8", extensions: ["jad"] },
  "text/vnd.trolltech.linguist": { source: "iana", charset: "UTF-8" },
  "text/vnd.wap.si": { source: "iana" },
  "text/vnd.wap.sl": { source: "iana" },
  "text/vnd.wap.wml": { source: "iana", extensions: ["wml"] },
  "text/vnd.wap.wmlscript": { source: "iana", extensions: ["wmls"] },
  "text/vtt": { source: "iana", charset: "UTF-8", compressible: !0, extensions: ["vtt"] },
  "text/x-asm": { source: "apache", extensions: ["s", "asm"] },
  "text/x-c": { source: "apache", extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"] },
  "text/x-component": { source: "nginx", extensions: ["htc"] },
  "text/x-fortran": { source: "apache", extensions: ["f", "for", "f77", "f90"] },
  "text/x-gwt-rpc": { compressible: !0 },
  "text/x-handlebars-template": { extensions: ["hbs"] },
  "text/x-java-source": { source: "apache", extensions: ["java"] },
  "text/x-jquery-tmpl": { compressible: !0 },
  "text/x-lua": { extensions: ["lua"] },
  "text/x-markdown": { compressible: !0, extensions: ["mkd"] },
  "text/x-nfo": { source: "apache", extensions: ["nfo"] },
  "text/x-opml": { source: "apache", extensions: ["opml"] },
  "text/x-org": { compressible: !0, extensions: ["org"] },
  "text/x-pascal": { source: "apache", extensions: ["p", "pas"] },
  "text/x-processing": { compressible: !0, extensions: ["pde"] },
  "text/x-sass": { extensions: ["sass"] },
  "text/x-scss": { extensions: ["scss"] },
  "text/x-setext": { source: "apache", extensions: ["etx"] },
  "text/x-sfv": { source: "apache", extensions: ["sfv"] },
  "text/x-suse-ymp": { compressible: !0, extensions: ["ymp"] },
  "text/x-uuencode": { source: "apache", extensions: ["uu"] },
  "text/x-vcalendar": { source: "apache", extensions: ["vcs"] },
  "text/x-vcard": { source: "apache", extensions: ["vcf"] },
  "text/xml": { source: "iana", compressible: !0, extensions: ["xml"] },
  "text/xml-external-parsed-entity": { source: "iana" },
  "text/yaml": { compressible: !0, extensions: ["yaml", "yml"] },
  "video/1d-interleaved-parityfec": { source: "iana" },
  "video/3gpp": { source: "iana", extensions: ["3gp", "3gpp"] },
  "video/3gpp-tt": { source: "iana" },
  "video/3gpp2": { source: "iana", extensions: ["3g2"] },
  "video/av1": { source: "iana" },
  "video/bmpeg": { source: "iana" },
  "video/bt656": { source: "iana" },
  "video/celb": { source: "iana" },
  "video/dv": { source: "iana" },
  "video/encaprtp": { source: "iana" },
  "video/ffv1": { source: "iana" },
  "video/flexfec": { source: "iana" },
  "video/h261": { source: "iana", extensions: ["h261"] },
  "video/h263": { source: "iana", extensions: ["h263"] },
  "video/h263-1998": { source: "iana" },
  "video/h263-2000": { source: "iana" },
  "video/h264": { source: "iana", extensions: ["h264"] },
  "video/h264-rcdo": { source: "iana" },
  "video/h264-svc": { source: "iana" },
  "video/h265": { source: "iana" },
  "video/iso.segment": { source: "iana", extensions: ["m4s"] },
  "video/jpeg": { source: "iana", extensions: ["jpgv"] },
  "video/jpeg2000": { source: "iana" },
  "video/jpm": { source: "apache", extensions: ["jpm", "jpgm"] },
  "video/jxsv": { source: "iana" },
  "video/mj2": { source: "iana", extensions: ["mj2", "mjp2"] },
  "video/mp1s": { source: "iana" },
  "video/mp2p": { source: "iana" },
  "video/mp2t": { source: "iana", extensions: ["ts"] },
  "video/mp4": { source: "iana", compressible: !1, extensions: ["mp4", "mp4v", "mpg4"] },
  "video/mp4v-es": { source: "iana" },
  "video/mpeg": { source: "iana", compressible: !1, extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"] },
  "video/mpeg4-generic": { source: "iana" },
  "video/mpv": { source: "iana" },
  "video/nv": { source: "iana" },
  "video/ogg": { source: "iana", compressible: !1, extensions: ["ogv"] },
  "video/parityfec": { source: "iana" },
  "video/pointer": { source: "iana" },
  "video/quicktime": { source: "iana", compressible: !1, extensions: ["qt", "mov"] },
  "video/raptorfec": { source: "iana" },
  "video/raw": { source: "iana" },
  "video/rtp-enc-aescm128": { source: "iana" },
  "video/rtploopback": { source: "iana" },
  "video/rtx": { source: "iana" },
  "video/scip": { source: "iana" },
  "video/smpte291": { source: "iana" },
  "video/smpte292m": { source: "iana" },
  "video/ulpfec": { source: "iana" },
  "video/vc1": { source: "iana" },
  "video/vc2": { source: "iana" },
  "video/vnd.cctv": { source: "iana" },
  "video/vnd.dece.hd": { source: "iana", extensions: ["uvh", "uvvh"] },
  "video/vnd.dece.mobile": { source: "iana", extensions: ["uvm", "uvvm"] },
  "video/vnd.dece.mp4": { source: "iana" },
  "video/vnd.dece.pd": { source: "iana", extensions: ["uvp", "uvvp"] },
  "video/vnd.dece.sd": { source: "iana", extensions: ["uvs", "uvvs"] },
  "video/vnd.dece.video": { source: "iana", extensions: ["uvv", "uvvv"] },
  "video/vnd.directv.mpeg": { source: "iana" },
  "video/vnd.directv.mpeg-tts": { source: "iana" },
  "video/vnd.dlna.mpeg-tts": { source: "iana" },
  "video/vnd.dvb.file": { source: "iana", extensions: ["dvb"] },
  "video/vnd.fvt": { source: "iana", extensions: ["fvt"] },
  "video/vnd.hns.video": { source: "iana" },
  "video/vnd.iptvforum.1dparityfec-1010": { source: "iana" },
  "video/vnd.iptvforum.1dparityfec-2005": { source: "iana" },
  "video/vnd.iptvforum.2dparityfec-1010": { source: "iana" },
  "video/vnd.iptvforum.2dparityfec-2005": { source: "iana" },
  "video/vnd.iptvforum.ttsavc": { source: "iana" },
  "video/vnd.iptvforum.ttsmpeg2": { source: "iana" },
  "video/vnd.motorola.video": { source: "iana" },
  "video/vnd.motorola.videop": { source: "iana" },
  "video/vnd.mpegurl": { source: "iana", extensions: ["mxu", "m4u"] },
  "video/vnd.ms-playready.media.pyv": { source: "iana", extensions: ["pyv"] },
  "video/vnd.nokia.interleaved-multimedia": { source: "iana" },
  "video/vnd.nokia.mp4vr": { source: "iana" },
  "video/vnd.nokia.videovoip": { source: "iana" },
  "video/vnd.objectvideo": { source: "iana" },
  "video/vnd.radgamettools.bink": { source: "iana" },
  "video/vnd.radgamettools.smacker": { source: "iana" },
  "video/vnd.sealed.mpeg1": { source: "iana" },
  "video/vnd.sealed.mpeg4": { source: "iana" },
  "video/vnd.sealed.swf": { source: "iana" },
  "video/vnd.sealedmedia.softseal.mov": { source: "iana" },
  "video/vnd.uvvu.mp4": { source: "iana", extensions: ["uvu", "uvvu"] },
  "video/vnd.vivo": { source: "iana", extensions: ["viv"] },
  "video/vnd.youtube.yt": { source: "iana" },
  "video/vp8": { source: "iana" },
  "video/vp9": { source: "iana" },
  "video/webm": { source: "apache", compressible: !1, extensions: ["webm"] },
  "video/x-f4v": { source: "apache", extensions: ["f4v"] },
  "video/x-fli": { source: "apache", extensions: ["fli"] },
  "video/x-flv": { source: "apache", compressible: !1, extensions: ["flv"] },
  "video/x-m4v": { source: "apache", extensions: ["m4v"] },
  "video/x-matroska": { source: "apache", compressible: !1, extensions: ["mkv", "mk3d", "mks"] },
  "video/x-mng": { source: "apache", extensions: ["mng"] },
  "video/x-ms-asf": { source: "apache", extensions: ["asf", "asx"] },
  "video/x-ms-vob": { source: "apache", extensions: ["vob"] },
  "video/x-ms-wm": { source: "apache", extensions: ["wm"] },
  "video/x-ms-wmv": { source: "apache", compressible: !1, extensions: ["wmv"] },
  "video/x-ms-wmx": { source: "apache", extensions: ["wmx"] },
  "video/x-ms-wvx": { source: "apache", extensions: ["wvx"] },
  "video/x-msvideo": { source: "apache", extensions: ["avi"] },
  "video/x-sgi-movie": { source: "apache", extensions: ["movie"] },
  "video/x-smv": { source: "apache", extensions: ["smv"] },
  "x-conference/x-cooltalk": { source: "apache", extensions: ["ice"] },
  "x-shader/x-fragment": { compressible: !0 },
  "x-shader/x-vertex": { compressible: !0 }
};
/*!
 * mime-db
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015-2022 Douglas Christopher Wilson
 * MIT Licensed
 */
var Gn, mr;
function Cu() {
  return mr || (mr = 1, Gn = Au), Gn;
}
/*!
 * mime-types
 * Copyright(c) 2014 Jonathan Ong
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */
var fr;
function Ou() {
  return fr || (fr = 1, (function(a) {
    var e = Cu(), t = ye.extname, i = /^\s*([^;\s]*)(?:;|\s|$)/, n = /^text\//i;
    a.charset = s, a.charsets = { lookup: s }, a.contentType = r, a.extension = c, a.extensions = /* @__PURE__ */ Object.create(null), a.lookup = l, a.types = /* @__PURE__ */ Object.create(null), p(a.extensions, a.types);
    function s(m) {
      if (!m || typeof m != "string")
        return !1;
      var u = i.exec(m), d = u && e[u[1].toLowerCase()];
      return d && d.charset ? d.charset : u && n.test(u[1]) ? "UTF-8" : !1;
    }
    function r(m) {
      if (!m || typeof m != "string")
        return !1;
      var u = m.indexOf("/") === -1 ? a.lookup(m) : m;
      if (!u)
        return !1;
      if (u.indexOf("charset") === -1) {
        var d = a.charset(u);
        d && (u += "; charset=" + d.toLowerCase());
      }
      return u;
    }
    function c(m) {
      if (!m || typeof m != "string")
        return !1;
      var u = i.exec(m), d = u && a.extensions[u[1].toLowerCase()];
      return !d || !d.length ? !1 : d[0];
    }
    function l(m) {
      if (!m || typeof m != "string")
        return !1;
      var u = t("x." + m).toLowerCase().substr(1);
      return u && a.types[u] || !1;
    }
    function p(m, u) {
      var d = ["nginx", "apache", void 0, "iana"];
      Object.keys(e).forEach(function(y) {
        var g = e[y], f = g.extensions;
        if (!(!f || !f.length)) {
          m[y] = f;
          for (var h = 0; h < f.length; h++) {
            var b = f[h];
            if (u[b]) {
              var S = d.indexOf(e[u[b]].source), E = d.indexOf(g.source);
              if (u[b] !== "application/octet-stream" && (S > E || S === E && u[b].substr(0, 12) === "application/"))
                continue;
            }
            u[b] = y;
          }
        }
      });
    }
  })(Wn)), Wn;
}
var Vn, hr;
function Du() {
  if (hr) return Vn;
  hr = 1, Vn = a;
  function a(e) {
    var t = typeof setImmediate == "function" ? setImmediate : typeof process == "object" && typeof process.nextTick == "function" ? process.nextTick : null;
    t ? t(e) : setTimeout(e, 0);
  }
  return Vn;
}
var Jn, vr;
function Oo() {
  if (vr) return Jn;
  vr = 1;
  var a = Du();
  Jn = e;
  function e(t) {
    var i = !1;
    return a(function() {
      i = !0;
    }), function(s, r) {
      i ? t(s, r) : a(function() {
        t(s, r);
      });
    };
  }
  return Jn;
}
var Xn, xr;
function Do() {
  if (xr) return Xn;
  xr = 1, Xn = a;
  function a(t) {
    Object.keys(t.jobs).forEach(e.bind(t)), t.jobs = {};
  }
  function e(t) {
    typeof this.jobs[t] == "function" && this.jobs[t]();
  }
  return Xn;
}
var Qn, gr;
function Io() {
  if (gr) return Qn;
  gr = 1;
  var a = Oo(), e = Do();
  Qn = t;
  function t(n, s, r, c) {
    var l = r.keyedList ? r.keyedList[r.index] : r.index;
    r.jobs[l] = i(s, l, n[l], function(p, m) {
      l in r.jobs && (delete r.jobs[l], p ? e(r) : r.results[l] = m, c(p, r.results));
    });
  }
  function i(n, s, r, c) {
    var l;
    return n.length == 2 ? l = n(r, a(c)) : l = n(r, s, a(c)), l;
  }
  return Qn;
}
var Zn, yr;
function Po() {
  if (yr) return Zn;
  yr = 1, Zn = a;
  function a(e, t) {
    var i = !Array.isArray(e), n = {
      index: 0,
      keyedList: i || t ? Object.keys(e) : null,
      jobs: {},
      results: i ? {} : [],
      size: i ? Object.keys(e).length : e.length
    };
    return t && n.keyedList.sort(i ? t : function(s, r) {
      return t(e[s], e[r]);
    }), n;
  }
  return Zn;
}
var ei, br;
function Fo() {
  if (br) return ei;
  br = 1;
  var a = Do(), e = Oo();
  ei = t;
  function t(i) {
    Object.keys(this.jobs).length && (this.index = this.size, a(this), e(i)(null, this.results));
  }
  return ei;
}
var ti, _r;
function Iu() {
  if (_r) return ti;
  _r = 1;
  var a = Io(), e = Po(), t = Fo();
  ti = i;
  function i(n, s, r) {
    for (var c = e(n); c.index < (c.keyedList || n).length; )
      a(n, s, c, function(l, p) {
        if (l) {
          r(l, p);
          return;
        }
        if (Object.keys(c.jobs).length === 0) {
          r(null, c.results);
          return;
        }
      }), c.index++;
    return t.bind(c, r);
  }
  return ti;
}
var vt = { exports: {} }, wr;
function Lo() {
  if (wr) return vt.exports;
  wr = 1;
  var a = Io(), e = Po(), t = Fo();
  vt.exports = i, vt.exports.ascending = n, vt.exports.descending = s;
  function i(r, c, l, p) {
    var m = e(r, l);
    return a(r, c, m, function u(d, v) {
      if (d) {
        p(d, v);
        return;
      }
      if (m.index++, m.index < (m.keyedList || r).length) {
        a(r, c, m, u);
        return;
      }
      p(null, m.results);
    }), t.bind(m, p);
  }
  function n(r, c) {
    return r < c ? -1 : r > c ? 1 : 0;
  }
  function s(r, c) {
    return -1 * n(r, c);
  }
  return vt.exports;
}
var ni, Er;
function Pu() {
  if (Er) return ni;
  Er = 1;
  var a = Lo();
  ni = e;
  function e(t, i, n) {
    return a(t, i, null, n);
  }
  return ni;
}
var ii, Sr;
function Fu() {
  return Sr || (Sr = 1, ii = {
    parallel: Iu(),
    serial: Pu(),
    serialOrdered: Lo()
  }), ii;
}
var ai, Rr;
function No() {
  return Rr || (Rr = 1, ai = Object), ai;
}
var ri, kr;
function Lu() {
  return kr || (kr = 1, ri = Error), ri;
}
var si, Tr;
function Nu() {
  return Tr || (Tr = 1, si = EvalError), si;
}
var oi, Ar;
function ju() {
  return Ar || (Ar = 1, oi = RangeError), oi;
}
var ci, Cr;
function Mu() {
  return Cr || (Cr = 1, ci = ReferenceError), ci;
}
var li, Or;
function Uu() {
  return Or || (Or = 1, li = SyntaxError), li;
}
var ui, Dr;
function fa() {
  return Dr || (Dr = 1, ui = TypeError), ui;
}
var pi, Ir;
function qu() {
  return Ir || (Ir = 1, pi = URIError), pi;
}
var di, Pr;
function Bu() {
  return Pr || (Pr = 1, di = Math.abs), di;
}
var mi, Fr;
function Hu() {
  return Fr || (Fr = 1, mi = Math.floor), mi;
}
var fi, Lr;
function $u() {
  return Lr || (Lr = 1, fi = Math.max), fi;
}
var hi, Nr;
function Ku() {
  return Nr || (Nr = 1, hi = Math.min), hi;
}
var vi, jr;
function zu() {
  return jr || (jr = 1, vi = Math.pow), vi;
}
var xi, Mr;
function Yu() {
  return Mr || (Mr = 1, xi = Math.round), xi;
}
var gi, Ur;
function Wu() {
  return Ur || (Ur = 1, gi = Number.isNaN || function(e) {
    return e !== e;
  }), gi;
}
var yi, qr;
function Gu() {
  if (qr) return yi;
  qr = 1;
  var a = /* @__PURE__ */ Wu();
  return yi = function(t) {
    return a(t) || t === 0 ? t : t < 0 ? -1 : 1;
  }, yi;
}
var bi, Br;
function Vu() {
  return Br || (Br = 1, bi = Object.getOwnPropertyDescriptor), bi;
}
var _i, Hr;
function jo() {
  if (Hr) return _i;
  Hr = 1;
  var a = /* @__PURE__ */ Vu();
  if (a)
    try {
      a([], "length");
    } catch {
      a = null;
    }
  return _i = a, _i;
}
var wi, $r;
function Ju() {
  if ($r) return wi;
  $r = 1;
  var a = Object.defineProperty || !1;
  if (a)
    try {
      a({}, "a", { value: 1 });
    } catch {
      a = !1;
    }
  return wi = a, wi;
}
var Ei, Kr;
function Mo() {
  return Kr || (Kr = 1, Ei = function() {
    if (typeof Symbol != "function" || typeof Object.getOwnPropertySymbols != "function")
      return !1;
    if (typeof Symbol.iterator == "symbol")
      return !0;
    var e = {}, t = Symbol("test"), i = Object(t);
    if (typeof t == "string" || Object.prototype.toString.call(t) !== "[object Symbol]" || Object.prototype.toString.call(i) !== "[object Symbol]")
      return !1;
    var n = 42;
    e[t] = n;
    for (var s in e)
      return !1;
    if (typeof Object.keys == "function" && Object.keys(e).length !== 0 || typeof Object.getOwnPropertyNames == "function" && Object.getOwnPropertyNames(e).length !== 0)
      return !1;
    var r = Object.getOwnPropertySymbols(e);
    if (r.length !== 1 || r[0] !== t || !Object.prototype.propertyIsEnumerable.call(e, t))
      return !1;
    if (typeof Object.getOwnPropertyDescriptor == "function") {
      var c = (
        /** @type {PropertyDescriptor} */
        Object.getOwnPropertyDescriptor(e, t)
      );
      if (c.value !== n || c.enumerable !== !0)
        return !1;
    }
    return !0;
  }), Ei;
}
var Si, zr;
function Xu() {
  if (zr) return Si;
  zr = 1;
  var a = typeof Symbol < "u" && Symbol, e = Mo();
  return Si = function() {
    return typeof a != "function" || typeof Symbol != "function" || typeof a("foo") != "symbol" || typeof Symbol("bar") != "symbol" ? !1 : e();
  }, Si;
}
var Ri, Yr;
function Uo() {
  return Yr || (Yr = 1, Ri = typeof Reflect < "u" && Reflect.getPrototypeOf || null), Ri;
}
var ki, Wr;
function qo() {
  if (Wr) return ki;
  Wr = 1;
  var a = /* @__PURE__ */ No();
  return ki = a.getPrototypeOf || null, ki;
}
var Ti, Gr;
function Qu() {
  if (Gr) return Ti;
  Gr = 1;
  var a = "Function.prototype.bind called on incompatible ", e = Object.prototype.toString, t = Math.max, i = "[object Function]", n = function(l, p) {
    for (var m = [], u = 0; u < l.length; u += 1)
      m[u] = l[u];
    for (var d = 0; d < p.length; d += 1)
      m[d + l.length] = p[d];
    return m;
  }, s = function(l, p) {
    for (var m = [], u = p, d = 0; u < l.length; u += 1, d += 1)
      m[d] = l[u];
    return m;
  }, r = function(c, l) {
    for (var p = "", m = 0; m < c.length; m += 1)
      p += c[m], m + 1 < c.length && (p += l);
    return p;
  };
  return Ti = function(l) {
    var p = this;
    if (typeof p != "function" || e.apply(p) !== i)
      throw new TypeError(a + p);
    for (var m = s(arguments, 1), u, d = function() {
      if (this instanceof u) {
        var h = p.apply(
          this,
          n(m, arguments)
        );
        return Object(h) === h ? h : this;
      }
      return p.apply(
        l,
        n(m, arguments)
      );
    }, v = t(0, p.length - m.length), y = [], g = 0; g < v; g++)
      y[g] = "$" + g;
    if (u = Function("binder", "return function (" + r(y, ",") + "){ return binder.apply(this,arguments); }")(d), p.prototype) {
      var f = function() {
      };
      f.prototype = p.prototype, u.prototype = new f(), f.prototype = null;
    }
    return u;
  }, Ti;
}
var Ai, Vr;
function an() {
  if (Vr) return Ai;
  Vr = 1;
  var a = Qu();
  return Ai = Function.prototype.bind || a, Ai;
}
var Ci, Jr;
function ha() {
  return Jr || (Jr = 1, Ci = Function.prototype.call), Ci;
}
var Oi, Xr;
function Bo() {
  return Xr || (Xr = 1, Oi = Function.prototype.apply), Oi;
}
var Di, Qr;
function Zu() {
  return Qr || (Qr = 1, Di = typeof Reflect < "u" && Reflect && Reflect.apply), Di;
}
var Ii, Zr;
function ep() {
  if (Zr) return Ii;
  Zr = 1;
  var a = an(), e = Bo(), t = ha(), i = Zu();
  return Ii = i || a.call(t, e), Ii;
}
var Pi, es;
function tp() {
  if (es) return Pi;
  es = 1;
  var a = an(), e = /* @__PURE__ */ fa(), t = ha(), i = ep();
  return Pi = function(s) {
    if (s.length < 1 || typeof s[0] != "function")
      throw new e("a function is required");
    return i(a, t, s);
  }, Pi;
}
var Fi, ts;
function np() {
  if (ts) return Fi;
  ts = 1;
  var a = tp(), e = /* @__PURE__ */ jo(), t;
  try {
    t = /** @type {{ __proto__?: typeof Array.prototype }} */
    [].__proto__ === Array.prototype;
  } catch (r) {
    if (!r || typeof r != "object" || !("code" in r) || r.code !== "ERR_PROTO_ACCESS")
      throw r;
  }
  var i = !!t && e && e(
    Object.prototype,
    /** @type {keyof typeof Object.prototype} */
    "__proto__"
  ), n = Object, s = n.getPrototypeOf;
  return Fi = i && typeof i.get == "function" ? a([i.get]) : typeof s == "function" ? (
    /** @type {import('./get')} */
    function(c) {
      return s(c == null ? c : n(c));
    }
  ) : !1, Fi;
}
var Li, ns;
function ip() {
  if (ns) return Li;
  ns = 1;
  var a = Uo(), e = qo(), t = /* @__PURE__ */ np();
  return Li = a ? function(n) {
    return a(n);
  } : e ? function(n) {
    if (!n || typeof n != "object" && typeof n != "function")
      throw new TypeError("getProto: not an object");
    return e(n);
  } : t ? function(n) {
    return t(n);
  } : null, Li;
}
var Ni, is;
function va() {
  if (is) return Ni;
  is = 1;
  var a = Function.prototype.call, e = Object.prototype.hasOwnProperty, t = an();
  return Ni = t.call(a, e), Ni;
}
var ji, as;
function ap() {
  if (as) return ji;
  as = 1;
  var a, e = /* @__PURE__ */ No(), t = /* @__PURE__ */ Lu(), i = /* @__PURE__ */ Nu(), n = /* @__PURE__ */ ju(), s = /* @__PURE__ */ Mu(), r = /* @__PURE__ */ Uu(), c = /* @__PURE__ */ fa(), l = /* @__PURE__ */ qu(), p = /* @__PURE__ */ Bu(), m = /* @__PURE__ */ Hu(), u = /* @__PURE__ */ $u(), d = /* @__PURE__ */ Ku(), v = /* @__PURE__ */ zu(), y = /* @__PURE__ */ Yu(), g = /* @__PURE__ */ Gu(), f = Function, h = function($) {
    try {
      return f('"use strict"; return (' + $ + ").constructor;")();
    } catch {
    }
  }, b = /* @__PURE__ */ jo(), S = /* @__PURE__ */ Ju(), E = function() {
    throw new c();
  }, w = b ? (function() {
    try {
      return arguments.callee, E;
    } catch {
      try {
        return b(arguments, "callee").get;
      } catch {
        return E;
      }
    }
  })() : E, A = Xu()(), O = ip(), W = qo(), X = Uo(), V = Bo(), pe = ha(), me = {}, ke = typeof Uint8Array > "u" || !O ? a : O(Uint8Array), le = {
    __proto__: null,
    "%AggregateError%": typeof AggregateError > "u" ? a : AggregateError,
    "%Array%": Array,
    "%ArrayBuffer%": typeof ArrayBuffer > "u" ? a : ArrayBuffer,
    "%ArrayIteratorPrototype%": A && O ? O([][Symbol.iterator]()) : a,
    "%AsyncFromSyncIteratorPrototype%": a,
    "%AsyncFunction%": me,
    "%AsyncGenerator%": me,
    "%AsyncGeneratorFunction%": me,
    "%AsyncIteratorPrototype%": me,
    "%Atomics%": typeof Atomics > "u" ? a : Atomics,
    "%BigInt%": typeof BigInt > "u" ? a : BigInt,
    "%BigInt64Array%": typeof BigInt64Array > "u" ? a : BigInt64Array,
    "%BigUint64Array%": typeof BigUint64Array > "u" ? a : BigUint64Array,
    "%Boolean%": Boolean,
    "%DataView%": typeof DataView > "u" ? a : DataView,
    "%Date%": Date,
    "%decodeURI%": decodeURI,
    "%decodeURIComponent%": decodeURIComponent,
    "%encodeURI%": encodeURI,
    "%encodeURIComponent%": encodeURIComponent,
    "%Error%": t,
    "%eval%": eval,
    // eslint-disable-line no-eval
    "%EvalError%": i,
    "%Float16Array%": typeof Float16Array > "u" ? a : Float16Array,
    "%Float32Array%": typeof Float32Array > "u" ? a : Float32Array,
    "%Float64Array%": typeof Float64Array > "u" ? a : Float64Array,
    "%FinalizationRegistry%": typeof FinalizationRegistry > "u" ? a : FinalizationRegistry,
    "%Function%": f,
    "%GeneratorFunction%": me,
    "%Int8Array%": typeof Int8Array > "u" ? a : Int8Array,
    "%Int16Array%": typeof Int16Array > "u" ? a : Int16Array,
    "%Int32Array%": typeof Int32Array > "u" ? a : Int32Array,
    "%isFinite%": isFinite,
    "%isNaN%": isNaN,
    "%IteratorPrototype%": A && O ? O(O([][Symbol.iterator]())) : a,
    "%JSON%": typeof JSON == "object" ? JSON : a,
    "%Map%": typeof Map > "u" ? a : Map,
    "%MapIteratorPrototype%": typeof Map > "u" || !A || !O ? a : O((/* @__PURE__ */ new Map())[Symbol.iterator]()),
    "%Math%": Math,
    "%Number%": Number,
    "%Object%": e,
    "%Object.getOwnPropertyDescriptor%": b,
    "%parseFloat%": parseFloat,
    "%parseInt%": parseInt,
    "%Promise%": typeof Promise > "u" ? a : Promise,
    "%Proxy%": typeof Proxy > "u" ? a : Proxy,
    "%RangeError%": n,
    "%ReferenceError%": s,
    "%Reflect%": typeof Reflect > "u" ? a : Reflect,
    "%RegExp%": RegExp,
    "%Set%": typeof Set > "u" ? a : Set,
    "%SetIteratorPrototype%": typeof Set > "u" || !A || !O ? a : O((/* @__PURE__ */ new Set())[Symbol.iterator]()),
    "%SharedArrayBuffer%": typeof SharedArrayBuffer > "u" ? a : SharedArrayBuffer,
    "%String%": String,
    "%StringIteratorPrototype%": A && O ? O(""[Symbol.iterator]()) : a,
    "%Symbol%": A ? Symbol : a,
    "%SyntaxError%": r,
    "%ThrowTypeError%": w,
    "%TypedArray%": ke,
    "%TypeError%": c,
    "%Uint8Array%": typeof Uint8Array > "u" ? a : Uint8Array,
    "%Uint8ClampedArray%": typeof Uint8ClampedArray > "u" ? a : Uint8ClampedArray,
    "%Uint16Array%": typeof Uint16Array > "u" ? a : Uint16Array,
    "%Uint32Array%": typeof Uint32Array > "u" ? a : Uint32Array,
    "%URIError%": l,
    "%WeakMap%": typeof WeakMap > "u" ? a : WeakMap,
    "%WeakRef%": typeof WeakRef > "u" ? a : WeakRef,
    "%WeakSet%": typeof WeakSet > "u" ? a : WeakSet,
    "%Function.prototype.call%": pe,
    "%Function.prototype.apply%": V,
    "%Object.defineProperty%": S,
    "%Object.getPrototypeOf%": W,
    "%Math.abs%": p,
    "%Math.floor%": m,
    "%Math.max%": u,
    "%Math.min%": d,
    "%Math.pow%": v,
    "%Math.round%": y,
    "%Math.sign%": g,
    "%Reflect.getPrototypeOf%": X
  };
  if (O)
    try {
      null.error;
    } catch ($) {
      var fe = O(O($));
      le["%Error.prototype%"] = fe;
    }
  var he = function $(G) {
    var q;
    if (G === "%AsyncFunction%")
      q = h("async function () {}");
    else if (G === "%GeneratorFunction%")
      q = h("function* () {}");
    else if (G === "%AsyncGeneratorFunction%")
      q = h("async function* () {}");
    else if (G === "%AsyncGenerator%") {
      var ee = $("%AsyncGeneratorFunction%");
      ee && (q = ee.prototype);
    } else if (G === "%AsyncIteratorPrototype%") {
      var ne = $("%AsyncGenerator%");
      ne && O && (q = O(ne.prototype));
    }
    return le[G] = q, q;
  }, we = {
    __proto__: null,
    "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
    "%ArrayPrototype%": ["Array", "prototype"],
    "%ArrayProto_entries%": ["Array", "prototype", "entries"],
    "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
    "%ArrayProto_keys%": ["Array", "prototype", "keys"],
    "%ArrayProto_values%": ["Array", "prototype", "values"],
    "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
    "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
    "%AsyncGeneratorPrototype%": ["AsyncGeneratorFunction", "prototype", "prototype"],
    "%BooleanPrototype%": ["Boolean", "prototype"],
    "%DataViewPrototype%": ["DataView", "prototype"],
    "%DatePrototype%": ["Date", "prototype"],
    "%ErrorPrototype%": ["Error", "prototype"],
    "%EvalErrorPrototype%": ["EvalError", "prototype"],
    "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
    "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
    "%FunctionPrototype%": ["Function", "prototype"],
    "%Generator%": ["GeneratorFunction", "prototype"],
    "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
    "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
    "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
    "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
    "%JSONParse%": ["JSON", "parse"],
    "%JSONStringify%": ["JSON", "stringify"],
    "%MapPrototype%": ["Map", "prototype"],
    "%NumberPrototype%": ["Number", "prototype"],
    "%ObjectPrototype%": ["Object", "prototype"],
    "%ObjProto_toString%": ["Object", "prototype", "toString"],
    "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
    "%PromisePrototype%": ["Promise", "prototype"],
    "%PromiseProto_then%": ["Promise", "prototype", "then"],
    "%Promise_all%": ["Promise", "all"],
    "%Promise_reject%": ["Promise", "reject"],
    "%Promise_resolve%": ["Promise", "resolve"],
    "%RangeErrorPrototype%": ["RangeError", "prototype"],
    "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
    "%RegExpPrototype%": ["RegExp", "prototype"],
    "%SetPrototype%": ["Set", "prototype"],
    "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
    "%StringPrototype%": ["String", "prototype"],
    "%SymbolPrototype%": ["Symbol", "prototype"],
    "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
    "%TypedArrayPrototype%": ["TypedArray", "prototype"],
    "%TypeErrorPrototype%": ["TypeError", "prototype"],
    "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
    "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
    "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
    "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
    "%URIErrorPrototype%": ["URIError", "prototype"],
    "%WeakMapPrototype%": ["WeakMap", "prototype"],
    "%WeakSetPrototype%": ["WeakSet", "prototype"]
  }, J = an(), k = /* @__PURE__ */ va(), M = J.call(pe, Array.prototype.concat), z = J.call(V, Array.prototype.splice), Z = J.call(pe, String.prototype.replace), re = J.call(pe, String.prototype.slice), de = J.call(pe, RegExp.prototype.exec), Y = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g, se = /\\(\\)?/g, P = function(G) {
    var q = re(G, 0, 1), ee = re(G, -1);
    if (q === "%" && ee !== "%")
      throw new r("invalid intrinsic syntax, expected closing `%`");
    if (ee === "%" && q !== "%")
      throw new r("invalid intrinsic syntax, expected opening `%`");
    var ne = [];
    return Z(G, Y, function(ie, ce, _e, be) {
      ne[ne.length] = _e ? Z(be, se, "$1") : ce || ie;
    }), ne;
  }, C = function(G, q) {
    var ee = G, ne;
    if (k(we, ee) && (ne = we[ee], ee = "%" + ne[0] + "%"), k(le, ee)) {
      var ie = le[ee];
      if (ie === me && (ie = he(ee)), typeof ie > "u" && !q)
        throw new c("intrinsic " + G + " exists, but is not available. Please file an issue!");
      return {
        alias: ne,
        name: ee,
        value: ie
      };
    }
    throw new r("intrinsic " + G + " does not exist!");
  };
  return ji = function(G, q) {
    if (typeof G != "string" || G.length === 0)
      throw new c("intrinsic name must be a non-empty string");
    if (arguments.length > 1 && typeof q != "boolean")
      throw new c('"allowMissing" argument must be a boolean');
    if (de(/^%?[^%]*%?$/, G) === null)
      throw new r("`%` may not be present anywhere but at the beginning and end of the intrinsic name");
    var ee = P(G), ne = ee.length > 0 ? ee[0] : "", ie = C("%" + ne + "%", q), ce = ie.name, _e = ie.value, be = !1, qe = ie.alias;
    qe && (ne = qe[0], z(ee, M([0, 1], qe)));
    for (var Fe = 1, He = !0; Fe < ee.length; Fe += 1) {
      var Me = ee[Fe], Ke = re(Me, 0, 1), ze = re(Me, -1);
      if ((Ke === '"' || Ke === "'" || Ke === "`" || ze === '"' || ze === "'" || ze === "`") && Ke !== ze)
        throw new r("property names with quotes must have matching quotes");
      if ((Me === "constructor" || !He) && (be = !0), ne += "." + Me, ce = "%" + ne + "%", k(le, ce))
        _e = le[ce];
      else if (_e != null) {
        if (!(Me in _e)) {
          if (!q)
            throw new c("base intrinsic for " + G + " exists, but the property is not available.");
          return;
        }
        if (b && Fe + 1 >= ee.length) {
          var Ge = b(_e, Me);
          He = !!Ge, He && "get" in Ge && !("originalValue" in Ge.get) ? _e = Ge.get : _e = _e[Me];
        } else
          He = k(_e, Me), _e = _e[Me];
        He && !be && (le[ce] = _e);
      }
    }
    return _e;
  }, ji;
}
var Mi, rs;
function rp() {
  if (rs) return Mi;
  rs = 1;
  var a = Mo();
  return Mi = function() {
    return a() && !!Symbol.toStringTag;
  }, Mi;
}
var Ui, ss;
function sp() {
  if (ss) return Ui;
  ss = 1;
  var a = /* @__PURE__ */ ap(), e = a("%Object.defineProperty%", !0), t = rp()(), i = /* @__PURE__ */ va(), n = /* @__PURE__ */ fa(), s = t ? Symbol.toStringTag : null;
  return Ui = function(c, l) {
    var p = arguments.length > 2 && !!arguments[2] && arguments[2].force, m = arguments.length > 2 && !!arguments[2] && arguments[2].nonConfigurable;
    if (typeof p < "u" && typeof p != "boolean" || typeof m < "u" && typeof m != "boolean")
      throw new n("if provided, the `overrideIfSet` and `nonConfigurable` options must be booleans");
    s && (p || !i(c, s)) && (e ? e(c, s, {
      configurable: !m,
      enumerable: !1,
      value: l,
      writable: !1
    }) : c[s] = l);
  }, Ui;
}
var qi, os;
function op() {
  return os || (os = 1, qi = function(a, e) {
    return Object.keys(e).forEach(function(t) {
      a[t] = a[t] || e[t];
    }), a;
  }), qi;
}
var Bi, cs;
function cp() {
  if (cs) return Bi;
  cs = 1;
  var a = Tu(), e = Qe, t = ye, i = sa, n = oa, s = Vt.parse, r = aa, c = Ce.Stream, l = We, p = Ou(), m = Fu(), u = /* @__PURE__ */ sp(), d = /* @__PURE__ */ va(), v = op();
  function y(g) {
    if (!(this instanceof y))
      return new y(g);
    this._overheadLength = 0, this._valueLength = 0, this._valuesToMeasure = [], a.call(this), g = g || {};
    for (var f in g)
      this[f] = g[f];
  }
  return e.inherits(y, a), y.LINE_BREAK = `\r
`, y.DEFAULT_CONTENT_TYPE = "application/octet-stream", y.prototype.append = function(g, f, h) {
    h = h || {}, typeof h == "string" && (h = { filename: h });
    var b = a.prototype.append.bind(this);
    if ((typeof f == "number" || f == null) && (f = String(f)), Array.isArray(f)) {
      this._error(new Error("Arrays are not supported."));
      return;
    }
    var S = this._multiPartHeader(g, f, h), E = this._multiPartFooter();
    b(S), b(f), b(E), this._trackLength(S, f, h);
  }, y.prototype._trackLength = function(g, f, h) {
    var b = 0;
    h.knownLength != null ? b += Number(h.knownLength) : Buffer.isBuffer(f) ? b = f.length : typeof f == "string" && (b = Buffer.byteLength(f)), this._valueLength += b, this._overheadLength += Buffer.byteLength(g) + y.LINE_BREAK.length, !(!f || !f.path && !(f.readable && d(f, "httpVersion")) && !(f instanceof c)) && (h.knownLength || this._valuesToMeasure.push(f));
  }, y.prototype._lengthRetriever = function(g, f) {
    d(g, "fd") ? g.end != null && g.end != 1 / 0 && g.start != null ? f(null, g.end + 1 - (g.start ? g.start : 0)) : r.stat(g.path, function(h, b) {
      if (h) {
        f(h);
        return;
      }
      var S = b.size - (g.start ? g.start : 0);
      f(null, S);
    }) : d(g, "httpVersion") ? f(null, Number(g.headers["content-length"])) : d(g, "httpModule") ? (g.on("response", function(h) {
      g.pause(), f(null, Number(h.headers["content-length"]));
    }), g.resume()) : f("Unknown stream");
  }, y.prototype._multiPartHeader = function(g, f, h) {
    if (typeof h.header == "string")
      return h.header;
    var b = this._getContentDisposition(f, h), S = this._getContentType(f, h), E = "", w = {
      // add custom disposition as third element or keep it two elements if not
      "Content-Disposition": ["form-data", 'name="' + g + '"'].concat(b || []),
      // if no content type. allow it to be empty array
      "Content-Type": [].concat(S || [])
    };
    typeof h.header == "object" && v(w, h.header);
    var A;
    for (var O in w)
      if (d(w, O)) {
        if (A = w[O], A == null)
          continue;
        Array.isArray(A) || (A = [A]), A.length && (E += O + ": " + A.join("; ") + y.LINE_BREAK);
      }
    return "--" + this.getBoundary() + y.LINE_BREAK + E + y.LINE_BREAK;
  }, y.prototype._getContentDisposition = function(g, f) {
    var h;
    if (typeof f.filepath == "string" ? h = t.normalize(f.filepath).replace(/\\/g, "/") : f.filename || g && (g.name || g.path) ? h = t.basename(f.filename || g && (g.name || g.path)) : g && g.readable && d(g, "httpVersion") && (h = t.basename(g.client._httpMessage.path || "")), h)
      return 'filename="' + h + '"';
  }, y.prototype._getContentType = function(g, f) {
    var h = f.contentType;
    return !h && g && g.name && (h = p.lookup(g.name)), !h && g && g.path && (h = p.lookup(g.path)), !h && g && g.readable && d(g, "httpVersion") && (h = g.headers["content-type"]), !h && (f.filepath || f.filename) && (h = p.lookup(f.filepath || f.filename)), !h && g && typeof g == "object" && (h = y.DEFAULT_CONTENT_TYPE), h;
  }, y.prototype._multiPartFooter = function() {
    return (function(g) {
      var f = y.LINE_BREAK, h = this._streams.length === 0;
      h && (f += this._lastBoundary()), g(f);
    }).bind(this);
  }, y.prototype._lastBoundary = function() {
    return "--" + this.getBoundary() + "--" + y.LINE_BREAK;
  }, y.prototype.getHeaders = function(g) {
    var f, h = {
      "content-type": "multipart/form-data; boundary=" + this.getBoundary()
    };
    for (f in g)
      d(g, f) && (h[f.toLowerCase()] = g[f]);
    return h;
  }, y.prototype.setBoundary = function(g) {
    if (typeof g != "string")
      throw new TypeError("FormData boundary must be a string");
    this._boundary = g;
  }, y.prototype.getBoundary = function() {
    return this._boundary || this._generateBoundary(), this._boundary;
  }, y.prototype.getBuffer = function() {
    for (var g = new Buffer.alloc(0), f = this.getBoundary(), h = 0, b = this._streams.length; h < b; h++)
      typeof this._streams[h] != "function" && (Buffer.isBuffer(this._streams[h]) ? g = Buffer.concat([g, this._streams[h]]) : g = Buffer.concat([g, Buffer.from(this._streams[h])]), (typeof this._streams[h] != "string" || this._streams[h].substring(2, f.length + 2) !== f) && (g = Buffer.concat([g, Buffer.from(y.LINE_BREAK)])));
    return Buffer.concat([g, Buffer.from(this._lastBoundary())]);
  }, y.prototype._generateBoundary = function() {
    this._boundary = "--------------------------" + l.randomBytes(12).toString("hex");
  }, y.prototype.getLengthSync = function() {
    var g = this._overheadLength + this._valueLength;
    return this._streams.length && (g += this._lastBoundary().length), this.hasKnownLength() || this._error(new Error("Cannot calculate proper length in synchronous way.")), g;
  }, y.prototype.hasKnownLength = function() {
    var g = !0;
    return this._valuesToMeasure.length && (g = !1), g;
  }, y.prototype.getLength = function(g) {
    var f = this._overheadLength + this._valueLength;
    if (this._streams.length && (f += this._lastBoundary().length), !this._valuesToMeasure.length) {
      process.nextTick(g.bind(this, null, f));
      return;
    }
    m.parallel(this._valuesToMeasure, this._lengthRetriever, function(h, b) {
      if (h) {
        g(h);
        return;
      }
      b.forEach(function(S) {
        f += S;
      }), g(null, f);
    });
  }, y.prototype.submit = function(g, f) {
    var h, b, S = { method: "post" };
    return typeof g == "string" ? (g = s(g), b = v({
      port: g.port,
      path: g.pathname,
      host: g.hostname,
      protocol: g.protocol
    }, S)) : (b = v(g, S), b.port || (b.port = b.protocol === "https:" ? 443 : 80)), b.headers = this.getHeaders(g.headers), b.protocol === "https:" ? h = n.request(b) : h = i.request(b), this.getLength((function(E, w) {
      if (E && E !== "Unknown stream") {
        this._error(E);
        return;
      }
      if (w && h.setHeader("Content-Length", w), this.pipe(h), f) {
        var A, O = function(W, X) {
          return h.removeListener("error", O), h.removeListener("response", A), f.call(this, W, X);
        };
        A = O.bind(this, null), h.on("error", O), h.on("response", A);
      }
    }).bind(this)), h;
  }, y.prototype._error = function(g) {
    this.error || (this.error = g, this.pause(), this.emit("error", g));
  }, y.prototype.toString = function() {
    return "[object FormData]";
  }, u(y.prototype, "FormData"), Bi = y, Bi;
}
var lp = cp();
const Ho = /* @__PURE__ */ Jt(lp);
function ea(a) {
  return _.isPlainObject(a) || _.isArray(a);
}
function $o(a) {
  return _.endsWith(a, "[]") ? a.slice(0, -2) : a;
}
function Hi(a, e, t) {
  return a ? a.concat(e).map(function(n, s) {
    return n = $o(n), !t && s ? "[" + n + "]" : n;
  }).join(t ? "." : "") : e;
}
function up(a) {
  return _.isArray(a) && !a.some(ea);
}
const pp = _.toFlatObject(_, {}, null, function(e) {
  return /^is[A-Z]/.test(e);
});
function rn(a, e, t) {
  if (!_.isObject(a))
    throw new TypeError("target must be an object");
  e = e || new (Ho || FormData)(), t = _.toFlatObject(
    t,
    {
      metaTokens: !0,
      dots: !1,
      indexes: !1
    },
    !1,
    function(f, h) {
      return !_.isUndefined(h[f]);
    }
  );
  const i = t.metaTokens, n = t.visitor || u, s = t.dots, r = t.indexes, c = t.Blob || typeof Blob < "u" && Blob, l = t.maxDepth === void 0 ? 100 : t.maxDepth, p = c && _.isSpecCompliantForm(e);
  if (!_.isFunction(n))
    throw new TypeError("visitor must be a function");
  function m(g) {
    if (g === null) return "";
    if (_.isDate(g))
      return g.toISOString();
    if (_.isBoolean(g))
      return g.toString();
    if (!p && _.isBlob(g))
      throw new U("Blob is not supported. Use a Buffer instead.");
    return _.isArrayBuffer(g) || _.isTypedArray(g) ? p && typeof Blob == "function" ? new Blob([g]) : Buffer.from(g) : g;
  }
  function u(g, f, h) {
    let b = g;
    if (_.isReactNative(e) && _.isReactNativeBlob(g))
      return e.append(Hi(h, f, s), m(g)), !1;
    if (g && !h && typeof g == "object") {
      if (_.endsWith(f, "{}"))
        f = i ? f : f.slice(0, -2), g = JSON.stringify(g);
      else if (_.isArray(g) && up(g) || (_.isFileList(g) || _.endsWith(f, "[]")) && (b = _.toArray(g)))
        return f = $o(f), b.forEach(function(E, w) {
          !(_.isUndefined(E) || E === null) && e.append(
            // eslint-disable-next-line no-nested-ternary
            r === !0 ? Hi([f], w, s) : r === null ? f : f + "[]",
            m(E)
          );
        }), !1;
    }
    return ea(g) ? !0 : (e.append(Hi(h, f, s), m(g)), !1);
  }
  const d = [], v = Object.assign(pp, {
    defaultVisitor: u,
    convertValue: m,
    isVisitable: ea
  });
  function y(g, f, h = 0) {
    if (!_.isUndefined(g)) {
      if (h > l)
        throw new U(
          "Object is too deeply nested (" + h + " levels). Max depth: " + l,
          U.ERR_FORM_DATA_DEPTH_EXCEEDED
        );
      if (d.indexOf(g) !== -1)
        throw Error("Circular reference detected in " + f.join("."));
      d.push(g), _.forEach(g, function(S, E) {
        (!(_.isUndefined(S) || S === null) && n.call(e, S, _.isString(E) ? E.trim() : E, f, v)) === !0 && y(S, f ? f.concat(E) : [E], h + 1);
      }), d.pop();
    }
  }
  if (!_.isObject(a))
    throw new TypeError("data must be an object");
  return y(a), e;
}
function ls(a) {
  const e = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+"
  };
  return encodeURIComponent(a).replace(/[!'()~]|%20/g, function(i) {
    return e[i];
  });
}
function Ko(a, e) {
  this._pairs = [], a && rn(a, this, e);
}
const zo = Ko.prototype;
zo.append = function(e, t) {
  this._pairs.push([e, t]);
};
zo.toString = function(e) {
  const t = e ? function(i) {
    return e.call(this, i, ls);
  } : ls;
  return this._pairs.map(function(n) {
    return t(n[0]) + "=" + t(n[1]);
  }, "").join("&");
};
function dp(a) {
  return encodeURIComponent(a).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+");
}
function xa(a, e, t) {
  if (!e)
    return a;
  const i = t && t.encode || dp, n = _.isFunction(t) ? {
    serialize: t
  } : t, s = n && n.serialize;
  let r;
  if (s ? r = s(e, n) : r = _.isURLSearchParams(e) ? e.toString() : new Ko(e, n).toString(i), r) {
    const c = a.indexOf("#");
    c !== -1 && (a = a.slice(0, c)), a += (a.indexOf("?") === -1 ? "?" : "&") + r;
  }
  return a;
}
class us {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   * @param {Object} options The options for the interceptor, synchronous and runWhen
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(e, t, i) {
    return this.handlers.push({
      fulfilled: e,
      rejected: t,
      synchronous: i ? i.synchronous : !1,
      runWhen: i ? i.runWhen : null
    }), this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {void}
   */
  eject(e) {
    this.handlers[e] && (this.handlers[e] = null);
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    this.handlers && (this.handlers = []);
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(e) {
    _.forEach(this.handlers, function(i) {
      i !== null && e(i);
    });
  }
}
const sn = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1,
  legacyInterceptorReqResOrdering: !0
}, mp = Vt.URLSearchParams, $i = "abcdefghijklmnopqrstuvwxyz", ps = "0123456789", Yo = {
  DIGIT: ps,
  ALPHA: $i,
  ALPHA_DIGIT: $i + $i.toUpperCase() + ps
}, fp = (a = 16, e = Yo.ALPHA_DIGIT) => {
  let t = "";
  const { length: i } = e, n = new Uint32Array(a);
  We.randomFillSync(n);
  for (let s = 0; s < a; s++)
    t += e[n[s] % i];
  return t;
}, hp = {
  isNode: !0,
  classes: {
    URLSearchParams: mp,
    FormData: Ho,
    Blob: typeof Blob < "u" && Blob || null
  },
  ALPHABET: Yo,
  generateString: fp,
  protocols: ["http", "https", "file", "data"]
}, ga = typeof window < "u" && typeof document < "u", ta = typeof navigator == "object" && navigator || void 0, vp = ga && (!ta || ["ReactNative", "NativeScript", "NS"].indexOf(ta.product) < 0), xp = typeof WorkerGlobalScope < "u" && // eslint-disable-next-line no-undef
self instanceof WorkerGlobalScope && typeof self.importScripts == "function", gp = ga && window.location.href || "http://localhost", yp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  hasBrowserEnv: ga,
  hasStandardBrowserEnv: vp,
  hasStandardBrowserWebWorkerEnv: xp,
  navigator: ta,
  origin: gp
}, Symbol.toStringTag, { value: "Module" })), Te = {
  ...yp,
  ...hp
};
function bp(a, e) {
  return rn(a, new Te.classes.URLSearchParams(), {
    visitor: function(t, i, n, s) {
      return Te.isNode && _.isBuffer(t) ? (this.append(i, t.toString("base64")), !1) : s.defaultVisitor.apply(this, arguments);
    },
    ...e
  });
}
function _p(a) {
  return _.matchAll(/\w+|\[(\w*)]/g, a).map((e) => e[0] === "[]" ? "" : e[1] || e[0]);
}
function wp(a) {
  const e = {}, t = Object.keys(a);
  let i;
  const n = t.length;
  let s;
  for (i = 0; i < n; i++)
    s = t[i], e[s] = a[s];
  return e;
}
function Wo(a) {
  function e(t, i, n, s) {
    let r = t[s++];
    if (r === "__proto__") return !0;
    const c = Number.isFinite(+r), l = s >= t.length;
    return r = !r && _.isArray(n) ? n.length : r, l ? (_.hasOwnProp(n, r) ? n[r] = _.isArray(n[r]) ? n[r].concat(i) : [n[r], i] : n[r] = i, !c) : ((!_.hasOwnProp(n, r) || !_.isObject(n[r])) && (n[r] = []), e(t, i, n[r], s) && _.isArray(n[r]) && (n[r] = wp(n[r])), !c);
  }
  if (_.isFormData(a) && _.isFunction(a.entries)) {
    const t = {};
    return _.forEachEntry(a, (i, n) => {
      e(_p(i), n, t, 0);
    }), t;
  }
  return null;
}
const rt = (a, e) => a != null && _.hasOwnProp(a, e) ? a[e] : void 0;
function Ep(a, e, t) {
  if (_.isString(a))
    try {
      return (e || JSON.parse)(a), _.trim(a);
    } catch (i) {
      if (i.name !== "SyntaxError")
        throw i;
    }
  return (t || JSON.stringify)(a);
}
const Tt = {
  transitional: sn,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [
    function(e, t) {
      const i = t.getContentType() || "", n = i.indexOf("application/json") > -1, s = _.isObject(e);
      if (s && _.isHTMLForm(e) && (e = new FormData(e)), _.isFormData(e))
        return n ? JSON.stringify(Wo(e)) : e;
      if (_.isArrayBuffer(e) || _.isBuffer(e) || _.isStream(e) || _.isFile(e) || _.isBlob(e) || _.isReadableStream(e))
        return e;
      if (_.isArrayBufferView(e))
        return e.buffer;
      if (_.isURLSearchParams(e))
        return t.setContentType("application/x-www-form-urlencoded;charset=utf-8", !1), e.toString();
      let c;
      if (s) {
        const l = rt(this, "formSerializer");
        if (i.indexOf("application/x-www-form-urlencoded") > -1)
          return bp(e, l).toString();
        if ((c = _.isFileList(e)) || i.indexOf("multipart/form-data") > -1) {
          const p = rt(this, "env"), m = p && p.FormData;
          return rn(
            c ? { "files[]": e } : e,
            m && new m(),
            l
          );
        }
      }
      return s || n ? (t.setContentType("application/json", !1), Ep(e)) : e;
    }
  ],
  transformResponse: [
    function(e) {
      const t = rt(this, "transitional") || Tt.transitional, i = t && t.forcedJSONParsing, n = rt(this, "responseType"), s = n === "json";
      if (_.isResponse(e) || _.isReadableStream(e))
        return e;
      if (e && _.isString(e) && (i && !n || s)) {
        const c = !(t && t.silentJSONParsing) && s;
        try {
          return JSON.parse(e, rt(this, "parseReviver"));
        } catch (l) {
          if (c)
            throw l.name === "SyntaxError" ? U.from(l, U.ERR_BAD_RESPONSE, this, null, rt(this, "response")) : l;
        }
      }
      return e;
    }
  ],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: Te.classes.FormData,
    Blob: Te.classes.Blob
  },
  validateStatus: function(e) {
    return e >= 200 && e < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
_.forEach(["delete", "get", "head", "post", "put", "patch", "query"], (a) => {
  Tt.headers[a] = {};
});
function Ki(a, e) {
  const t = this || Tt, i = e || t, n = Oe.from(i.headers);
  let s = i.data;
  return _.forEach(a, function(c) {
    s = c.call(t, s, n.normalize(), e ? e.status : void 0);
  }), n.normalize(), s;
}
function Go(a) {
  return !!(a && a.__CANCEL__);
}
let nt = class extends U {
  /**
   * A `CanceledError` is an object that is thrown when an operation is canceled.
   *
   * @param {string=} message The message.
   * @param {Object=} config The config.
   * @param {Object=} request The request.
   *
   * @returns {CanceledError} The created error.
   */
  constructor(e, t, i) {
    super(e ?? "canceled", U.ERR_CANCELED, t, i), this.name = "CanceledError", this.__CANCEL__ = !0;
  }
};
function ot(a, e, t) {
  const i = t.config.validateStatus;
  !t.status || !i || i(t.status) ? a(t) : e(new U(
    "Request failed with status code " + t.status,
    t.status >= 400 && t.status < 500 ? U.ERR_BAD_REQUEST : U.ERR_BAD_RESPONSE,
    t.config,
    t.request,
    t
  ));
}
function Sp(a) {
  return typeof a != "string" ? !1 : /^([a-z][a-z\d+\-.]*:)?\/\//i.test(a);
}
function Rp(a, e) {
  return e ? a.replace(/\/?\/$/, "") + "/" + e.replace(/^\/+/, "") : a;
}
function ya(a, e, t) {
  let i = !Sp(e);
  return a && (i || t === !1) ? Rp(a, e) : e;
}
var kp = {
  ftp: 21,
  gopher: 70,
  http: 80,
  https: 443,
  ws: 80,
  wss: 443
};
function Tp(a) {
  try {
    return new URL(a);
  } catch {
    return null;
  }
}
function Ap(a) {
  var e = (typeof a == "string" ? Tp(a) : a) || {}, t = e.protocol, i = e.host, n = e.port;
  if (typeof i != "string" || !i || typeof t != "string" || (t = t.split(":", 1)[0], i = i.replace(/:\d*$/, ""), n = parseInt(n) || kp[t] || 0, !Cp(i, n)))
    return "";
  var s = na(t + "_proxy") || na("all_proxy");
  return s && s.indexOf("://") === -1 && (s = t + "://" + s), s;
}
function Cp(a, e) {
  var t = na("no_proxy").toLowerCase();
  return t ? t === "*" ? !1 : t.split(/[,\s]/).every(function(i) {
    if (!i)
      return !0;
    var n = i.match(/^(.+):(\d+)$/), s = n ? n[1] : i, r = n ? parseInt(n[2]) : 0;
    return r && r !== e ? !0 : /^[.*]/.test(s) ? (s.charAt(0) === "*" && (s = s.slice(1)), !a.endsWith(s)) : a !== s;
  }) : !0;
}
function na(a) {
  return process.env[a.toLowerCase()] || process.env[a.toUpperCase()] || "";
}
var Ve = {}, Nt = { exports: {} }, jt = { exports: {} }, zi, ds;
function Op() {
  if (ds) return zi;
  ds = 1;
  var a = 1e3, e = a * 60, t = e * 60, i = t * 24, n = i * 7, s = i * 365.25;
  zi = function(m, u) {
    u = u || {};
    var d = typeof m;
    if (d === "string" && m.length > 0)
      return r(m);
    if (d === "number" && isFinite(m))
      return u.long ? l(m) : c(m);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(m)
    );
  };
  function r(m) {
    if (m = String(m), !(m.length > 100)) {
      var u = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        m
      );
      if (u) {
        var d = parseFloat(u[1]), v = (u[2] || "ms").toLowerCase();
        switch (v) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return d * s;
          case "weeks":
          case "week":
          case "w":
            return d * n;
          case "days":
          case "day":
          case "d":
            return d * i;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return d * t;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return d * e;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return d * a;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return d;
          default:
            return;
        }
      }
    }
  }
  function c(m) {
    var u = Math.abs(m);
    return u >= i ? Math.round(m / i) + "d" : u >= t ? Math.round(m / t) + "h" : u >= e ? Math.round(m / e) + "m" : u >= a ? Math.round(m / a) + "s" : m + "ms";
  }
  function l(m) {
    var u = Math.abs(m);
    return u >= i ? p(m, u, i, "day") : u >= t ? p(m, u, t, "hour") : u >= e ? p(m, u, e, "minute") : u >= a ? p(m, u, a, "second") : m + " ms";
  }
  function p(m, u, d, v) {
    var y = u >= d * 1.5;
    return Math.round(m / d) + " " + v + (y ? "s" : "");
  }
  return zi;
}
var Yi, ms;
function Vo() {
  if (ms) return Yi;
  ms = 1;
  function a(e) {
    i.debug = i, i.default = i, i.coerce = p, i.disable = c, i.enable = s, i.enabled = l, i.humanize = Op(), i.destroy = m, Object.keys(e).forEach((u) => {
      i[u] = e[u];
    }), i.names = [], i.skips = [], i.formatters = {};
    function t(u) {
      let d = 0;
      for (let v = 0; v < u.length; v++)
        d = (d << 5) - d + u.charCodeAt(v), d |= 0;
      return i.colors[Math.abs(d) % i.colors.length];
    }
    i.selectColor = t;
    function i(u) {
      let d, v = null, y, g;
      function f(...h) {
        if (!f.enabled)
          return;
        const b = f, S = Number(/* @__PURE__ */ new Date()), E = S - (d || S);
        b.diff = E, b.prev = d, b.curr = S, d = S, h[0] = i.coerce(h[0]), typeof h[0] != "string" && h.unshift("%O");
        let w = 0;
        h[0] = h[0].replace(/%([a-zA-Z%])/g, (O, W) => {
          if (O === "%%")
            return "%";
          w++;
          const X = i.formatters[W];
          if (typeof X == "function") {
            const V = h[w];
            O = X.call(b, V), h.splice(w, 1), w--;
          }
          return O;
        }), i.formatArgs.call(b, h), (b.log || i.log).apply(b, h);
      }
      return f.namespace = u, f.useColors = i.useColors(), f.color = i.selectColor(u), f.extend = n, f.destroy = i.destroy, Object.defineProperty(f, "enabled", {
        enumerable: !0,
        configurable: !1,
        get: () => v !== null ? v : (y !== i.namespaces && (y = i.namespaces, g = i.enabled(u)), g),
        set: (h) => {
          v = h;
        }
      }), typeof i.init == "function" && i.init(f), f;
    }
    function n(u, d) {
      const v = i(this.namespace + (typeof d > "u" ? ":" : d) + u);
      return v.log = this.log, v;
    }
    function s(u) {
      i.save(u), i.namespaces = u, i.names = [], i.skips = [];
      const d = (typeof u == "string" ? u : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const v of d)
        v[0] === "-" ? i.skips.push(v.slice(1)) : i.names.push(v);
    }
    function r(u, d) {
      let v = 0, y = 0, g = -1, f = 0;
      for (; v < u.length; )
        if (y < d.length && (d[y] === u[v] || d[y] === "*"))
          d[y] === "*" ? (g = y, f = v, y++) : (v++, y++);
        else if (g !== -1)
          y = g + 1, f++, v = f;
        else
          return !1;
      for (; y < d.length && d[y] === "*"; )
        y++;
      return y === d.length;
    }
    function c() {
      const u = [
        ...i.names,
        ...i.skips.map((d) => "-" + d)
      ].join(",");
      return i.enable(""), u;
    }
    function l(u) {
      for (const d of i.skips)
        if (r(u, d))
          return !1;
      for (const d of i.names)
        if (r(u, d))
          return !0;
      return !1;
    }
    function p(u) {
      return u instanceof Error ? u.stack || u.message : u;
    }
    function m() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    return i.enable(i.load()), i;
  }
  return Yi = a, Yi;
}
var fs;
function Dp() {
  return fs || (fs = 1, (function(a, e) {
    e.formatArgs = i, e.save = n, e.load = s, e.useColors = t, e.storage = r(), e.destroy = /* @__PURE__ */ (() => {
      let l = !1;
      return () => {
        l || (l = !0, console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."));
      };
    })(), e.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function t() {
      if (typeof window < "u" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
        return !0;
      if (typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
        return !1;
      let l;
      return typeof document < "u" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window < "u" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator < "u" && navigator.userAgent && (l = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(l[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator < "u" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function i(l) {
      if (l[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + l[0] + (this.useColors ? "%c " : " ") + "+" + a.exports.humanize(this.diff), !this.useColors)
        return;
      const p = "color: " + this.color;
      l.splice(1, 0, p, "color: inherit");
      let m = 0, u = 0;
      l[0].replace(/%[a-zA-Z%]/g, (d) => {
        d !== "%%" && (m++, d === "%c" && (u = m));
      }), l.splice(u, 0, p);
    }
    e.log = console.debug || console.log || (() => {
    });
    function n(l) {
      try {
        l ? e.storage.setItem("debug", l) : e.storage.removeItem("debug");
      } catch {
      }
    }
    function s() {
      let l;
      try {
        l = e.storage.getItem("debug") || e.storage.getItem("DEBUG");
      } catch {
      }
      return !l && typeof process < "u" && "env" in process && (l = process.env.DEBUG), l;
    }
    function r() {
      try {
        return localStorage;
      } catch {
      }
    }
    a.exports = Vo()(e);
    const { formatters: c } = a.exports;
    c.j = function(l) {
      try {
        return JSON.stringify(l);
      } catch (p) {
        return "[UnexpectedJSONParseError]: " + p.message;
      }
    };
  })(jt, jt.exports)), jt.exports;
}
var Mt = { exports: {} }, Wi, hs;
function Ip() {
  return hs || (hs = 1, Wi = (a, e = process.argv) => {
    const t = a.startsWith("-") ? "" : a.length === 1 ? "-" : "--", i = e.indexOf(t + a), n = e.indexOf("--");
    return i !== -1 && (n === -1 || i < n);
  }), Wi;
}
var Gi, vs;
function Pp() {
  if (vs) return Gi;
  vs = 1;
  const a = yc, e = Xs, t = Ip(), { env: i } = process;
  let n;
  t("no-color") || t("no-colors") || t("color=false") || t("color=never") ? n = 0 : (t("color") || t("colors") || t("color=true") || t("color=always")) && (n = 1);
  function s() {
    if ("FORCE_COLOR" in i)
      return i.FORCE_COLOR === "true" ? 1 : i.FORCE_COLOR === "false" ? 0 : i.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(i.FORCE_COLOR, 10), 3);
  }
  function r(p) {
    return p === 0 ? !1 : {
      level: p,
      hasBasic: !0,
      has256: p >= 2,
      has16m: p >= 3
    };
  }
  function c(p, { streamIsTTY: m, sniffFlags: u = !0 } = {}) {
    const d = s();
    d !== void 0 && (n = d);
    const v = u ? n : d;
    if (v === 0)
      return 0;
    if (u) {
      if (t("color=16m") || t("color=full") || t("color=truecolor"))
        return 3;
      if (t("color=256"))
        return 2;
    }
    if (p && !m && v === void 0)
      return 0;
    const y = v || 0;
    if (i.TERM === "dumb")
      return y;
    if (process.platform === "win32") {
      const g = a.release().split(".");
      return Number(g[0]) >= 10 && Number(g[2]) >= 10586 ? Number(g[2]) >= 14931 ? 3 : 2 : 1;
    }
    if ("CI" in i)
      return ["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((g) => g in i) || i.CI_NAME === "codeship" ? 1 : y;
    if ("TEAMCITY_VERSION" in i)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(i.TEAMCITY_VERSION) ? 1 : 0;
    if (i.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in i) {
      const g = Number.parseInt((i.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (i.TERM_PROGRAM) {
        case "iTerm.app":
          return g >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(i.TERM) ? 2 : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(i.TERM) || "COLORTERM" in i ? 1 : y;
  }
  function l(p, m = {}) {
    const u = c(p, {
      streamIsTTY: p && p.isTTY,
      ...m
    });
    return r(u);
  }
  return Gi = {
    supportsColor: l,
    stdout: l({ isTTY: e.isatty(1) }),
    stderr: l({ isTTY: e.isatty(2) })
  }, Gi;
}
var xs;
function Fp() {
  return xs || (xs = 1, (function(a, e) {
    const t = Xs, i = Qe;
    e.init = m, e.log = c, e.formatArgs = s, e.save = l, e.load = p, e.useColors = n, e.destroy = i.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    ), e.colors = [6, 2, 3, 4, 5, 1];
    try {
      const d = Pp();
      d && (d.stderr || d).level >= 2 && (e.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ]);
    } catch {
    }
    e.inspectOpts = Object.keys(process.env).filter((d) => /^debug_/i.test(d)).reduce((d, v) => {
      const y = v.substring(6).toLowerCase().replace(/_([a-z])/g, (f, h) => h.toUpperCase());
      let g = process.env[v];
      return /^(yes|on|true|enabled)$/i.test(g) ? g = !0 : /^(no|off|false|disabled)$/i.test(g) ? g = !1 : g === "null" ? g = null : g = Number(g), d[y] = g, d;
    }, {});
    function n() {
      return "colors" in e.inspectOpts ? !!e.inspectOpts.colors : t.isatty(process.stderr.fd);
    }
    function s(d) {
      const { namespace: v, useColors: y } = this;
      if (y) {
        const g = this.color, f = "\x1B[3" + (g < 8 ? g : "8;5;" + g), h = `  ${f};1m${v} \x1B[0m`;
        d[0] = h + d[0].split(`
`).join(`
` + h), d.push(f + "m+" + a.exports.humanize(this.diff) + "\x1B[0m");
      } else
        d[0] = r() + v + " " + d[0];
    }
    function r() {
      return e.inspectOpts.hideDate ? "" : (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function c(...d) {
      return process.stderr.write(i.formatWithOptions(e.inspectOpts, ...d) + `
`);
    }
    function l(d) {
      d ? process.env.DEBUG = d : delete process.env.DEBUG;
    }
    function p() {
      return process.env.DEBUG;
    }
    function m(d) {
      d.inspectOpts = {};
      const v = Object.keys(e.inspectOpts);
      for (let y = 0; y < v.length; y++)
        d.inspectOpts[v[y]] = e.inspectOpts[v[y]];
    }
    a.exports = Vo()(e);
    const { formatters: u } = a.exports;
    u.o = function(d) {
      return this.inspectOpts.colors = this.useColors, i.inspect(d, this.inspectOpts).split(`
`).map((v) => v.trim()).join(" ");
    }, u.O = function(d) {
      return this.inspectOpts.colors = this.useColors, i.inspect(d, this.inspectOpts);
    };
  })(Mt, Mt.exports)), Mt.exports;
}
var gs;
function on() {
  return gs || (gs = 1, typeof process > "u" || process.type === "renderer" || process.browser === !0 || process.__nwjs ? Nt.exports = Dp() : Nt.exports = Fp()), Nt.exports;
}
var Ut = {}, ys;
function Lp() {
  if (ys) return Ut;
  ys = 1, Object.defineProperty(Ut, "__esModule", { value: !0 });
  function a(e) {
    return function(t, i) {
      return new Promise((n, s) => {
        e.call(this, t, i, (r, c) => {
          r ? s(r) : n(c);
        });
      });
    };
  }
  return Ut.default = a, Ut;
}
var xt, bs;
function Np() {
  if (bs) return xt;
  bs = 1;
  var a = xt && xt.__importDefault || function(l) {
    return l && l.__esModule ? l : { default: l };
  };
  const e = Js, t = a(on()), i = a(Lp()), n = t.default("agent-base");
  function s(l) {
    return !!l && typeof l.addRequest == "function";
  }
  function r() {
    const { stack: l } = new Error();
    return typeof l != "string" ? !1 : l.split(`
`).some((p) => p.indexOf("(https.js:") !== -1 || p.indexOf("node:https:") !== -1);
  }
  function c(l, p) {
    return new c.Agent(l, p);
  }
  return (function(l) {
    class p extends e.EventEmitter {
      constructor(u, d) {
        super();
        let v = d;
        typeof u == "function" ? this.callback = u : u && (v = u), this.timeout = null, v && typeof v.timeout == "number" && (this.timeout = v.timeout), this.maxFreeSockets = 1, this.maxSockets = 1, this.maxTotalSockets = 1 / 0, this.sockets = {}, this.freeSockets = {}, this.requests = {}, this.options = {};
      }
      get defaultPort() {
        return typeof this.explicitDefaultPort == "number" ? this.explicitDefaultPort : r() ? 443 : 80;
      }
      set defaultPort(u) {
        this.explicitDefaultPort = u;
      }
      get protocol() {
        return typeof this.explicitProtocol == "string" ? this.explicitProtocol : r() ? "https:" : "http:";
      }
      set protocol(u) {
        this.explicitProtocol = u;
      }
      callback(u, d, v) {
        throw new Error('"agent-base" has no default implementation, you must subclass and override `callback()`');
      }
      /**
       * Called by node-core's "_http_client.js" module when creating
       * a new HTTP request with this Agent instance.
       *
       * @api public
       */
      addRequest(u, d) {
        const v = Object.assign({}, d);
        typeof v.secureEndpoint != "boolean" && (v.secureEndpoint = r()), v.host == null && (v.host = "localhost"), v.port == null && (v.port = v.secureEndpoint ? 443 : 80), v.protocol == null && (v.protocol = v.secureEndpoint ? "https:" : "http:"), v.host && v.path && delete v.path, delete v.agent, delete v.hostname, delete v._defaultAgent, delete v.defaultPort, delete v.createConnection, u._last = !0, u.shouldKeepAlive = !1;
        let y = !1, g = null;
        const f = v.timeout || this.timeout, h = (w) => {
          u._hadError || (u.emit("error", w), u._hadError = !0);
        }, b = () => {
          g = null, y = !0;
          const w = new Error(`A "socket" was not created for HTTP request before ${f}ms`);
          w.code = "ETIMEOUT", h(w);
        }, S = (w) => {
          y || (g !== null && (clearTimeout(g), g = null), h(w));
        }, E = (w) => {
          if (y)
            return;
          if (g != null && (clearTimeout(g), g = null), s(w)) {
            n("Callback returned another Agent instance %o", w.constructor.name), w.addRequest(u, v);
            return;
          }
          if (w) {
            w.once("free", () => {
              this.freeSocket(w, v);
            }), u.onSocket(w);
            return;
          }
          const A = new Error(`no Duplex stream was returned to agent-base for \`${u.method} ${u.path}\``);
          h(A);
        };
        if (typeof this.callback != "function") {
          h(new Error("`callback` is not defined"));
          return;
        }
        this.promisifiedCallback || (this.callback.length >= 3 ? (n("Converting legacy callback function to promise"), this.promisifiedCallback = i.default(this.callback)) : this.promisifiedCallback = this.callback), typeof f == "number" && f > 0 && (g = setTimeout(b, f)), "port" in v && typeof v.port != "number" && (v.port = Number(v.port));
        try {
          n("Resolving socket for %o request: %o", v.protocol, `${u.method} ${u.path}`), Promise.resolve(this.promisifiedCallback(u, v)).then(E, S);
        } catch (w) {
          Promise.reject(w).catch(S);
        }
      }
      freeSocket(u, d) {
        n("Freeing socket %o %o", u.constructor.name, d), u.destroy();
      }
      destroy() {
        n("Destroying agent %o", this.constructor.name);
      }
    }
    l.Agent = p, l.prototype = l.Agent.prototype;
  })(c || (c = {})), xt = c, xt;
}
var st = {}, _s;
function jp() {
  if (_s) return st;
  _s = 1;
  var a = st && st.__importDefault || function(n) {
    return n && n.__esModule ? n : { default: n };
  };
  Object.defineProperty(st, "__esModule", { value: !0 });
  const t = a(on()).default("https-proxy-agent:parse-proxy-response");
  function i(n) {
    return new Promise((s, r) => {
      let c = 0;
      const l = [];
      function p() {
        const g = n.read();
        g ? y(g) : n.once("readable", p);
      }
      function m() {
        n.removeListener("end", d), n.removeListener("error", v), n.removeListener("close", u), n.removeListener("readable", p);
      }
      function u(g) {
        t("onclose had error %o", g);
      }
      function d() {
        t("onend");
      }
      function v(g) {
        m(), t("onerror %o", g), r(g);
      }
      function y(g) {
        l.push(g), c += g.length;
        const f = Buffer.concat(l, c);
        if (f.indexOf(`\r
\r
`) === -1) {
          t("have not received end of HTTP headers yet..."), p();
          return;
        }
        const b = f.toString("ascii", 0, f.indexOf(`\r
`)), S = +b.split(" ")[1];
        t("got proxy server response: %o", b), s({
          statusCode: S,
          buffered: f
        });
      }
      n.on("error", v), n.on("close", u), n.on("end", d), p();
    });
  }
  return st.default = i, st;
}
var ws;
function Mp() {
  if (ws) return Ve;
  ws = 1;
  var a = Ve && Ve.__awaiter || function(g, f, h, b) {
    function S(E) {
      return E instanceof h ? E : new h(function(w) {
        w(E);
      });
    }
    return new (h || (h = Promise))(function(E, w) {
      function A(X) {
        try {
          W(b.next(X));
        } catch (V) {
          w(V);
        }
      }
      function O(X) {
        try {
          W(b.throw(X));
        } catch (V) {
          w(V);
        }
      }
      function W(X) {
        X.done ? E(X.value) : S(X.value).then(A, O);
      }
      W((b = b.apply(g, f || [])).next());
    });
  }, e = Ve && Ve.__importDefault || function(g) {
    return g && g.__esModule ? g : { default: g };
  };
  Object.defineProperty(Ve, "__esModule", { value: !0 });
  const t = e(xc), i = e(gc), n = e(Vt), s = e(ra), r = e(on()), c = Np(), l = e(jp()), p = r.default("https-proxy-agent:agent");
  class m extends c.Agent {
    constructor(f) {
      let h;
      if (typeof f == "string" ? h = n.default.parse(f) : h = f, !h)
        throw new Error("an HTTP(S) proxy server `host` and `port` must be specified!");
      p("creating new HttpsProxyAgent instance: %o", h), super(h);
      const b = Object.assign({}, h);
      this.secureProxy = h.secureProxy || v(b.protocol), b.host = b.hostname || b.host, typeof b.port == "string" && (b.port = parseInt(b.port, 10)), !b.port && b.host && (b.port = this.secureProxy ? 443 : 80), this.secureProxy && !("ALPNProtocols" in b) && (b.ALPNProtocols = ["http 1.1"]), b.host && b.path && (delete b.path, delete b.pathname), this.proxy = b;
    }
    /**
     * Called when the node-core HTTP client library is creating a
     * new HTTP request.
     *
     * @api protected
     */
    callback(f, h) {
      return a(this, void 0, void 0, function* () {
        const { proxy: b, secureProxy: S } = this;
        let E;
        S ? (p("Creating `tls.Socket`: %o", b), E = i.default.connect(b)) : (p("Creating `net.Socket`: %o", b), E = t.default.connect(b));
        const w = Object.assign({}, b.headers);
        let O = `CONNECT ${`${h.host}:${h.port}`} HTTP/1.1\r
`;
        b.auth && (w["Proxy-Authorization"] = `Basic ${Buffer.from(b.auth).toString("base64")}`);
        let { host: W, port: X, secureEndpoint: V } = h;
        d(X, V) || (W += `:${X}`), w.Host = W, w.Connection = "close";
        for (const fe of Object.keys(w))
          O += `${fe}: ${w[fe]}\r
`;
        const pe = l.default(E);
        E.write(`${O}\r
`);
        const { statusCode: me, buffered: ke } = yield pe;
        if (me === 200) {
          if (f.once("socket", u), h.secureEndpoint) {
            p("Upgrading socket connection to TLS");
            const fe = h.servername || h.host;
            return i.default.connect(Object.assign(Object.assign({}, y(h, "host", "hostname", "path", "port")), {
              socket: E,
              servername: fe
            }));
          }
          return E;
        }
        E.destroy();
        const le = new t.default.Socket({ writable: !1 });
        return le.readable = !0, f.once("socket", (fe) => {
          p("replaying proxy buffer for failed request"), s.default(fe.listenerCount("data") > 0), fe.push(ke), fe.push(null);
        }), le;
      });
    }
  }
  Ve.default = m;
  function u(g) {
    g.resume();
  }
  function d(g, f) {
    return !!(!f && g === 80 || f && g === 443);
  }
  function v(g) {
    return typeof g == "string" ? /^https:?$/i.test(g) : !1;
  }
  function y(g, ...f) {
    const h = {};
    let b;
    for (b in g)
      f.includes(b) || (h[b] = g[b]);
    return h;
  }
  return Ve;
}
var gt, Es;
function Up() {
  if (Es) return gt;
  Es = 1;
  var a = gt && gt.__importDefault || function(i) {
    return i && i.__esModule ? i : { default: i };
  };
  const e = a(Mp());
  function t(i) {
    return new e.default(i);
  }
  return (function(i) {
    i.HttpsProxyAgent = e.default, i.prototype = e.default.prototype;
  })(t || (t = {})), gt = t, gt;
}
var qp = Up();
const Jo = /* @__PURE__ */ Jt(qp);
var qt = { exports: {} }, Vi, Ss;
function Bp() {
  if (Ss) return Vi;
  Ss = 1;
  var a;
  return Vi = function() {
    if (!a) {
      try {
        a = on()("follow-redirects");
      } catch {
      }
      typeof a != "function" && (a = function() {
      });
    }
    a.apply(null, arguments);
  }, Vi;
}
var Rs;
function Hp() {
  if (Rs) return qt.exports;
  Rs = 1;
  var a = Vt, e = a.URL, t = sa, i = oa, n = Ce.Writable, s = ra, r = Bp();
  (function() {
    var M = typeof process < "u", z = typeof window < "u" && typeof document < "u", Z = fe(Error.captureStackTrace);
    !M && (z || !Z) && console.warn("The follow-redirects package should be excluded from browser builds.");
  })();
  var c = !1;
  try {
    s(new e(""));
  } catch (k) {
    c = k.code === "ERR_INVALID_URL";
  }
  var l = [
    "Authorization",
    "Proxy-Authorization",
    "Cookie"
  ], p = [
    "auth",
    "host",
    "hostname",
    "href",
    "path",
    "pathname",
    "port",
    "protocol",
    "query",
    "search",
    "hash"
  ], m = ["abort", "aborted", "connect", "error", "socket", "timeout"], u = /* @__PURE__ */ Object.create(null);
  m.forEach(function(k) {
    u[k] = function(M, z, Z) {
      this._redirectable.emit(k, M, z, Z);
    };
  });
  var d = V(
    "ERR_INVALID_URL",
    "Invalid URL",
    TypeError
  ), v = V(
    "ERR_FR_REDIRECTION_FAILURE",
    "Redirected request failed"
  ), y = V(
    "ERR_FR_TOO_MANY_REDIRECTS",
    "Maximum number of redirects exceeded",
    v
  ), g = V(
    "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
    "Request body larger than maxBodyLength limit"
  ), f = V(
    "ERR_STREAM_WRITE_AFTER_END",
    "write after end"
  ), h = n.prototype.destroy || E;
  function b(k, M) {
    n.call(this), this._sanitizeOptions(k), this._options = k, this._ended = !1, this._ending = !1, this._redirectCount = 0, this._redirects = [], this._requestBodyLength = 0, this._requestBodyBuffers = [], M && this.on("response", M);
    var z = this;
    this._onNativeResponse = function(Z) {
      try {
        z._processResponse(Z);
      } catch (re) {
        z.emit("error", re instanceof v ? re : new v({ cause: re }));
      }
    }, this._headerFilter = new RegExp("^(?:" + l.concat(k.sensitiveHeaders).map(J).join("|") + ")$", "i"), this._performRequest();
  }
  b.prototype = Object.create(n.prototype), b.prototype.abort = function() {
    pe(this._currentRequest), this._currentRequest.abort(), this.emit("abort");
  }, b.prototype.destroy = function(k) {
    return pe(this._currentRequest, k), h.call(this, k), this;
  }, b.prototype.write = function(k, M, z) {
    if (this._ending)
      throw new f();
    if (!le(k) && !he(k))
      throw new TypeError("data should be a string, Buffer or Uint8Array");
    if (fe(M) && (z = M, M = null), k.length === 0) {
      z && z();
      return;
    }
    this._requestBodyLength + k.length <= this._options.maxBodyLength ? (this._requestBodyLength += k.length, this._requestBodyBuffers.push({ data: k, encoding: M }), this._currentRequest.write(k, M, z)) : (this.emit("error", new g()), this.abort());
  }, b.prototype.end = function(k, M, z) {
    if (fe(k) ? (z = k, k = M = null) : fe(M) && (z = M, M = null), !k)
      this._ended = this._ending = !0, this._currentRequest.end(null, null, z);
    else {
      var Z = this, re = this._currentRequest;
      this.write(k, M, function() {
        Z._ended = !0, re.end(null, null, z);
      }), this._ending = !0;
    }
  }, b.prototype.setHeader = function(k, M) {
    this._options.headers[k] = M, this._currentRequest.setHeader(k, M);
  }, b.prototype.removeHeader = function(k) {
    delete this._options.headers[k], this._currentRequest.removeHeader(k);
  }, b.prototype.setTimeout = function(k, M) {
    var z = this;
    function Z(Y) {
      Y.setTimeout(k), Y.removeListener("timeout", Y.destroy), Y.addListener("timeout", Y.destroy);
    }
    function re(Y) {
      z._timeout && clearTimeout(z._timeout), z._timeout = setTimeout(function() {
        z.emit("timeout"), de();
      }, k), Z(Y);
    }
    function de() {
      z._timeout && (clearTimeout(z._timeout), z._timeout = null), z.removeListener("abort", de), z.removeListener("error", de), z.removeListener("response", de), z.removeListener("close", de), M && z.removeListener("timeout", M), z.socket || z._currentRequest.removeListener("socket", re);
    }
    return M && this.on("timeout", M), this.socket ? re(this.socket) : this._currentRequest.once("socket", re), this.on("socket", Z), this.on("abort", de), this.on("error", de), this.on("response", de), this.on("close", de), this;
  }, [
    "flushHeaders",
    "getHeader",
    "setNoDelay",
    "setSocketKeepAlive"
  ].forEach(function(k) {
    b.prototype[k] = function(M, z) {
      return this._currentRequest[k](M, z);
    };
  }), ["aborted", "connection", "socket"].forEach(function(k) {
    Object.defineProperty(b.prototype, k, {
      get: function() {
        return this._currentRequest[k];
      }
    });
  }), b.prototype._sanitizeOptions = function(k) {
    if (k.headers || (k.headers = {}), ke(k.sensitiveHeaders) || (k.sensitiveHeaders = []), k.host && (k.hostname || (k.hostname = k.host), delete k.host), !k.pathname && k.path) {
      var M = k.path.indexOf("?");
      M < 0 ? k.pathname = k.path : (k.pathname = k.path.substring(0, M), k.search = k.path.substring(M));
    }
  }, b.prototype._performRequest = function() {
    var k = this._options.protocol, M = this._options.nativeProtocols[k];
    if (!M)
      throw new TypeError("Unsupported protocol " + k);
    if (this._options.agents) {
      var z = k.slice(0, -1);
      this._options.agent = this._options.agents[z];
    }
    var Z = this._currentRequest = M.request(this._options, this._onNativeResponse);
    Z._redirectable = this;
    for (var re of m)
      Z.on(re, u[re]);
    if (this._currentUrl = /^\//.test(this._options.path) ? a.format(this._options) : (
      // When making a request to a proxy, […]
      // a client MUST send the target URI in absolute-form […].
      this._options.path
    ), this._isRedirect) {
      var de = 0, Y = this, se = this._requestBodyBuffers;
      (function P(C) {
        if (Z === Y._currentRequest)
          if (C)
            Y.emit("error", C);
          else if (de < se.length) {
            var $ = se[de++];
            Z.finished || Z.write($.data, $.encoding, P);
          } else Y._ended && Z.end();
      })();
    }
  }, b.prototype._processResponse = function(k) {
    var M = k.statusCode;
    this._options.trackRedirects && this._redirects.push({
      url: this._currentUrl,
      headers: k.headers,
      statusCode: M
    });
    var z = k.headers.location;
    if (!z || this._options.followRedirects === !1 || M < 300 || M >= 400) {
      k.responseUrl = this._currentUrl, k.redirects = this._redirects, this.emit("response", k), this._requestBodyBuffers = [];
      return;
    }
    if (pe(this._currentRequest), k.destroy(), ++this._redirectCount > this._options.maxRedirects)
      throw new y();
    var Z, re = this._options.beforeRedirect;
    re && (Z = Object.assign({
      // The Host header was set by nativeProtocol.request
      Host: k.req.getHeader("host")
    }, this._options.headers));
    var de = this._options.method;
    ((M === 301 || M === 302) && this._options.method === "POST" || // RFC7231§6.4.4: The 303 (See Other) status code indicates that
    // the server is redirecting the user agent to a different resource […]
    // A user agent can perform a retrieval request targeting that URI
    // (a GET or HEAD request if using HTTP) […]
    M === 303 && !/^(?:GET|HEAD)$/.test(this._options.method)) && (this._options.method = "GET", this._requestBodyBuffers = [], X(/^content-/i, this._options.headers));
    var Y = X(/^host$/i, this._options.headers), se = w(this._currentUrl), P = Y || se.host, C = /^\w+:/.test(z) ? this._currentUrl : a.format(Object.assign(se, { host: P })), $ = A(z, C);
    if (r("redirecting to", $.href), this._isRedirect = !0, W($, this._options), ($.protocol !== se.protocol && $.protocol !== "https:" || $.host !== P && !me($.host, P)) && X(this._headerFilter, this._options.headers), fe(re)) {
      var G = {
        headers: k.headers,
        statusCode: M
      }, q = {
        url: C,
        method: de,
        headers: Z
      };
      re(this._options, G, q), this._sanitizeOptions(this._options);
    }
    this._performRequest();
  };
  function S(k) {
    var M = {
      maxRedirects: 21,
      maxBodyLength: 10485760
    }, z = {};
    return Object.keys(k).forEach(function(Z) {
      var re = Z + ":", de = z[re] = k[Z], Y = M[Z] = Object.create(de);
      function se(C, $, G) {
        return we(C) ? C = W(C) : le(C) ? C = W(w(C)) : (G = $, $ = O(C), C = { protocol: re }), fe($) && (G = $, $ = null), $ = Object.assign({
          maxRedirects: M.maxRedirects,
          maxBodyLength: M.maxBodyLength
        }, C, $), $.nativeProtocols = z, !le($.host) && !le($.hostname) && ($.hostname = "::1"), s.equal($.protocol, re, "protocol mismatch"), r("options", $), new b($, G);
      }
      function P(C, $, G) {
        var q = Y.request(C, $, G);
        return q.end(), q;
      }
      Object.defineProperties(Y, {
        request: { value: se, configurable: !0, enumerable: !0, writable: !0 },
        get: { value: P, configurable: !0, enumerable: !0, writable: !0 }
      });
    }), M;
  }
  function E() {
  }
  function w(k) {
    var M;
    if (c)
      M = new e(k);
    else if (M = O(a.parse(k)), !le(M.protocol))
      throw new d({ input: k });
    return M;
  }
  function A(k, M) {
    return c ? new e(k, M) : w(a.resolve(M, k));
  }
  function O(k) {
    if (/^\[/.test(k.hostname) && !/^\[[:0-9a-f]+\]$/i.test(k.hostname))
      throw new d({ input: k.href || k });
    if (/^\[/.test(k.host) && !/^\[[:0-9a-f]+\](:\d+)?$/i.test(k.host))
      throw new d({ input: k.href || k });
    return k;
  }
  function W(k, M) {
    var z = M || {};
    for (var Z of p)
      z[Z] = k[Z];
    return z.hostname.startsWith("[") && (z.hostname = z.hostname.slice(1, -1)), z.port !== "" && (z.port = Number(z.port)), z.path = z.search ? z.pathname + z.search : z.pathname, z;
  }
  function X(k, M) {
    var z;
    for (var Z in M)
      k.test(Z) && (z = M[Z], delete M[Z]);
    return z === null || typeof z > "u" ? void 0 : String(z).trim();
  }
  function V(k, M, z) {
    function Z(re) {
      fe(Error.captureStackTrace) && Error.captureStackTrace(this, this.constructor), Object.assign(this, re || {}), this.code = k, this.message = this.cause ? M + ": " + this.cause.message : M;
    }
    return Z.prototype = new (z || Error)(), Object.defineProperties(Z.prototype, {
      constructor: {
        value: Z,
        enumerable: !1
      },
      name: {
        value: "Error [" + k + "]",
        enumerable: !1
      }
    }), Z;
  }
  function pe(k, M) {
    for (var z of m)
      k.removeListener(z, u[z]);
    k.on("error", E), k.destroy(M);
  }
  function me(k, M) {
    s(le(k) && le(M));
    var z = k.length - M.length - 1;
    return z > 0 && k[z] === "." && k.endsWith(M);
  }
  function ke(k) {
    return k instanceof Array;
  }
  function le(k) {
    return typeof k == "string" || k instanceof String;
  }
  function fe(k) {
    return typeof k == "function";
  }
  function he(k) {
    return typeof k == "object" && "length" in k;
  }
  function we(k) {
    return e && k instanceof e;
  }
  function J(k) {
    return k.replace(/[\]\\/()*+?.$]/g, "\\$&");
  }
  return qt.exports = S({ http: t, https: i }), qt.exports.wrap = S, qt.exports;
}
var $p = Hp();
const Kp = /* @__PURE__ */ Jt($p), yt = "1.16.1";
function Xo(a) {
  const e = /^([-+\w]{1,25}):(?:\/\/)?/.exec(a);
  return e && e[1] || "";
}
const zp = /^([^,;]+\/[^,;]+)?((?:;[^,;=]+=[^,;]+)*)(;base64)?,([\s\S]*)$/;
function Yp(a, e, t) {
  const i = t && t.Blob || Te.classes.Blob, n = Xo(a);
  if (e === void 0 && i && (e = !0), n === "data") {
    a = n.length ? a.slice(n.length + 1) : a;
    const s = zp.exec(a);
    if (!s)
      throw new U("Invalid URL", U.ERR_INVALID_URL);
    const r = s[1], c = s[2], l = s[3] ? "base64" : "utf8", p = s[4];
    let m;
    r ? m = c ? r + c : r : c && (m = "text/plain" + c);
    const u = Buffer.from(decodeURIComponent(p), l);
    if (e) {
      if (!i)
        throw new U("Blob is not supported", U.ERR_NOT_SUPPORT);
      return new i([u], { type: m });
    }
    return u;
  }
  throw new U("Unsupported protocol " + n, U.ERR_NOT_SUPPORT);
}
const Ji = Symbol("internals");
class ks extends Ce.Transform {
  constructor(e) {
    e = _.toFlatObject(
      e,
      {
        maxRate: 0,
        chunkSize: 64 * 1024,
        minChunkSize: 100,
        timeWindow: 500,
        ticksRate: 2,
        samplesCount: 15
      },
      null,
      (i, n) => !_.isUndefined(n[i])
    ), super({
      readableHighWaterMark: e.chunkSize
    });
    const t = this[Ji] = {
      timeWindow: e.timeWindow,
      chunkSize: e.chunkSize,
      maxRate: e.maxRate,
      minChunkSize: e.minChunkSize,
      bytesSeen: 0,
      isCaptured: !1,
      notifiedBytesLoaded: 0,
      ts: Date.now(),
      bytes: 0,
      onReadCallback: null
    };
    this.on("newListener", (i) => {
      i === "progress" && (t.isCaptured || (t.isCaptured = !0));
    });
  }
  _read(e) {
    const t = this[Ji];
    return t.onReadCallback && t.onReadCallback(), super._read(e);
  }
  _transform(e, t, i) {
    const n = this[Ji], s = n.maxRate, r = this.readableHighWaterMark, c = n.timeWindow, l = 1e3 / c, p = s / l, m = n.minChunkSize !== !1 ? Math.max(n.minChunkSize, p * 0.01) : 0, u = (v, y) => {
      const g = Buffer.byteLength(v);
      n.bytesSeen += g, n.bytes += g, n.isCaptured && this.emit("progress", n.bytesSeen), this.push(v) ? process.nextTick(y) : n.onReadCallback = () => {
        n.onReadCallback = null, process.nextTick(y);
      };
    }, d = (v, y) => {
      const g = Buffer.byteLength(v);
      let f = null, h = r, b, S = 0;
      if (s) {
        const E = Date.now();
        (!n.ts || (S = E - n.ts) >= c) && (n.ts = E, b = p - n.bytes, n.bytes = b < 0 ? -b : 0, S = 0), b = p - n.bytes;
      }
      if (s) {
        if (b <= 0)
          return setTimeout(() => {
            y(null, v);
          }, c - S);
        b < h && (h = b);
      }
      h && g > h && g - h > m && (f = v.subarray(h), v = v.subarray(0, h)), u(
        v,
        f ? () => {
          process.nextTick(y, null, f);
        } : y
      );
    };
    d(e, function v(y, g) {
      if (y)
        return i(y);
      g ? d(g, v) : i(null);
    });
  }
}
const { asyncIterator: Ts } = Symbol, Qo = async function* (a) {
  a.stream ? yield* a.stream() : a.arrayBuffer ? yield await a.arrayBuffer() : a[Ts] ? yield* a[Ts]() : yield a;
}, Wp = Te.ALPHABET.ALPHA_DIGIT + "-_", bt = typeof TextEncoder == "function" ? new TextEncoder() : new Qe.TextEncoder(), et = `\r
`, Gp = bt.encode(et), Vp = 2;
class Jp {
  constructor(e, t) {
    const { escapeName: i } = this.constructor, n = _.isString(t);
    let s = `Content-Disposition: form-data; name="${i(e)}"${!n && t.name ? `; filename="${i(t.name)}"` : ""}${et}`;
    if (n)
      t = bt.encode(String(t).replace(/\r?\n|\r\n?/g, et));
    else {
      const r = String(t.type || "application/octet-stream").replace(/[\r\n]/g, "");
      s += `Content-Type: ${r}${et}`;
    }
    this.headers = bt.encode(s + et), this.contentLength = n ? t.byteLength : t.size, this.size = this.headers.byteLength + this.contentLength + Vp, this.name = e, this.value = t;
  }
  async *encode() {
    yield this.headers;
    const { value: e } = this;
    _.isTypedArray(e) ? yield e : yield* Qo(e), yield Gp;
  }
  static escapeName(e) {
    return String(e).replace(
      /[\r\n"]/g,
      (t) => ({
        "\r": "%0D",
        "\n": "%0A",
        '"': "%22"
      })[t]
    );
  }
}
const Xp = (a, e, t) => {
  const {
    tag: i = "form-data-boundary",
    size: n = 25,
    boundary: s = i + "-" + Te.generateString(n, Wp)
  } = t || {};
  if (!_.isFormData(a))
    throw TypeError("FormData instance required");
  if (s.length < 1 || s.length > 70)
    throw Error("boundary must be 1-70 characters long");
  const r = bt.encode("--" + s + et), c = bt.encode("--" + s + "--" + et);
  let l = c.byteLength;
  const p = Array.from(a.entries()).map(([u, d]) => {
    const v = new Jp(u, d);
    return l += v.size, v;
  });
  l += r.byteLength * p.length, l = _.toFiniteNumber(l);
  const m = {
    "Content-Type": `multipart/form-data; boundary=${s}`
  };
  return Number.isFinite(l) && (m["Content-Length"] = l), e && e(m), hc.from(
    (async function* () {
      for (const u of p)
        yield r, yield* u.encode();
      yield c;
    })()
  );
};
class Qp extends Ce.Transform {
  __transform(e, t, i) {
    this.push(e), i();
  }
  _transform(e, t, i) {
    if (e.length !== 0 && (this._transform = this.__transform, e[0] !== 120)) {
      const n = Buffer.alloc(2);
      n[0] = 120, n[1] = 156, this.push(n, t);
    }
    this.__transform(e, t, i);
  }
}
const Zp = (a, e) => _.isAsyncFn(a) ? function(...t) {
  const i = t.pop();
  a.apply(this, t).then((n) => {
    try {
      e ? i(null, ...e(n)) : i(null, n);
    } catch (s) {
      i(s);
    }
  }, i);
} : a, ed = /* @__PURE__ */ new Set(["localhost"]), Zo = (a) => {
  const e = a.split(".");
  return e.length !== 4 || e[0] !== "127" ? !1 : e.every((t) => /^\d+$/.test(t) && Number(t) >= 0 && Number(t) <= 255);
}, td = (a) => {
  if (a === "::1") return !0;
  const e = a.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (e) return Zo(e[1]);
  const t = a.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (t) {
    const n = parseInt(t[1], 16);
    return n >= 32512 && n <= 32767;
  }
  const i = a.split(":");
  if (i.length === 8) {
    for (let n = 0; n < 7; n++)
      if (!/^0+$/.test(i[n])) return !1;
    return /^0*1$/.test(i[7]);
  }
  return !1;
}, As = (a) => a ? ed.has(a) || Zo(a) ? !0 : td(a) : !1, nd = {
  http: 80,
  https: 443,
  ws: 80,
  wss: 443,
  ftp: 21
}, id = (a) => {
  let e = a, t = 0;
  if (e.charAt(0) === "[") {
    const s = e.indexOf("]");
    if (s !== -1) {
      const r = e.slice(1, s), c = e.slice(s + 1);
      return c.charAt(0) === ":" && /^\d+$/.test(c.slice(1)) && (t = Number.parseInt(c.slice(1), 10)), [r, t];
    }
  }
  const i = e.indexOf(":"), n = e.lastIndexOf(":");
  return i !== -1 && i === n && /^\d+$/.test(e.slice(n + 1)) && (t = Number.parseInt(e.slice(n + 1), 10), e = e.slice(0, n)), [e, t];
}, ad = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:(\d+\.\d+\.\d+\.\d+)$/i, rd = /^(?:::|(?:0{1,4}:){1,4}:|(?:0{1,4}:){5})ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i, sd = (a) => {
  if (typeof a != "string" || a.indexOf(":") === -1) return a;
  const e = a.match(ad);
  if (e) return e[1];
  const t = a.match(rd);
  if (t) {
    const i = parseInt(t[1], 16), n = parseInt(t[2], 16);
    return `${i >> 8}.${i & 255}.${n >> 8}.${n & 255}`;
  }
  return a;
}, Cs = (a) => a && (a.charAt(0) === "[" && a.charAt(a.length - 1) === "]" && (a = a.slice(1, -1)), sd(a.replace(/\.+$/, "")));
function od(a) {
  let e;
  try {
    e = new URL(a);
  } catch {
    return !1;
  }
  const t = (process.env.no_proxy || process.env.NO_PROXY || "").toLowerCase();
  if (!t)
    return !1;
  if (t === "*")
    return !0;
  const i = Number.parseInt(e.port, 10) || nd[e.protocol.split(":", 1)[0]] || 0, n = Cs(e.hostname.toLowerCase());
  return t.split(/[\s,]+/).some((s) => {
    if (!s)
      return !1;
    let [r, c] = id(s);
    return r = Cs(r), !r || c && c !== i ? !1 : (r.charAt(0) === "*" && (r = r.slice(1)), r.charAt(0) === "." ? n.endsWith(r) : n === r || As(n) && As(r));
  });
}
function cd(a, e) {
  a = a || 10;
  const t = new Array(a), i = new Array(a);
  let n = 0, s = 0, r;
  return e = e !== void 0 ? e : 1e3, function(l) {
    const p = Date.now(), m = i[s];
    r || (r = p), t[n] = l, i[n] = p;
    let u = s, d = 0;
    for (; u !== n; )
      d += t[u++], u = u % a;
    if (n = (n + 1) % a, n === s && (s = (s + 1) % a), p - r < e)
      return;
    const v = m && p - m;
    return v ? Math.round(d * 1e3 / v) : void 0;
  };
}
function ld(a, e) {
  let t = 0, i = 1e3 / e, n, s;
  const r = (p, m = Date.now()) => {
    t = m, n = null, s && (clearTimeout(s), s = null), a(...p);
  };
  return [(...p) => {
    const m = Date.now(), u = m - t;
    u >= i ? r(p, m) : (n = p, s || (s = setTimeout(() => {
      s = null, r(n);
    }, i - u)));
  }, () => n && r(n)];
}
const lt = (a, e, t = 3) => {
  let i = 0;
  const n = cd(50, 250);
  return ld((s) => {
    if (!s || typeof s.loaded != "number")
      return;
    const r = s.loaded, c = s.lengthComputable ? s.total : void 0, l = c != null ? Math.min(r, c) : r, p = Math.max(0, l - i), m = n(p);
    i = Math.max(i, l);
    const u = {
      loaded: l,
      total: c,
      progress: c ? l / c : void 0,
      bytes: p,
      rate: m || void 0,
      estimated: m && c ? (c - l) / m : void 0,
      event: s,
      lengthComputable: c != null,
      [e ? "download" : "upload"]: !0
    };
    a(u);
  }, t);
}, Wt = (a, e) => {
  const t = a != null;
  return [
    (i) => e[0]({
      lengthComputable: t,
      total: a,
      loaded: i
    }),
    e[1]
  ];
}, Gt = (a) => (...e) => _.asap(() => a(...e));
function ec(a) {
  if (!a || typeof a != "string" || !a.startsWith("data:")) return 0;
  const e = a.indexOf(",");
  if (e < 0) return 0;
  const t = a.slice(5, e), i = a.slice(e + 1);
  if (/;base64/i.test(t)) {
    let r = i.length;
    const c = i.length;
    for (let v = 0; v < c; v++)
      if (i.charCodeAt(v) === 37 && v + 2 < c) {
        const y = i.charCodeAt(v + 1), g = i.charCodeAt(v + 2);
        (y >= 48 && y <= 57 || y >= 65 && y <= 70 || y >= 97 && y <= 102) && (g >= 48 && g <= 57 || g >= 65 && g <= 70 || g >= 97 && g <= 102) && (r -= 2, v += 2);
      }
    let l = 0, p = c - 1;
    const m = (v) => v >= 2 && i.charCodeAt(v - 2) === 37 && // '%'
    i.charCodeAt(v - 1) === 51 && // '3'
    (i.charCodeAt(v) === 68 || i.charCodeAt(v) === 100);
    p >= 0 && (i.charCodeAt(p) === 61 ? (l++, p--) : m(p) && (l++, p -= 3)), l === 1 && p >= 0 && (i.charCodeAt(p) === 61 || m(p)) && l++;
    const d = Math.floor(r / 4) * 3 - (l || 0);
    return d > 0 ? d : 0;
  }
  if (typeof Buffer < "u" && typeof Buffer.byteLength == "function")
    return Buffer.byteLength(i, "utf8");
  let s = 0;
  for (let r = 0, c = i.length; r < c; r++) {
    const l = i.charCodeAt(r);
    if (l < 128)
      s += 1;
    else if (l < 2048)
      s += 2;
    else if (l >= 55296 && l <= 56319 && r + 1 < c) {
      const p = i.charCodeAt(r + 1);
      p >= 56320 && p <= 57343 ? (s += 4, r++) : s += 3;
    } else
      s += 3;
  }
  return s;
}
const Os = {
  flush: Je.constants.Z_SYNC_FLUSH,
  finishFlush: Je.constants.Z_SYNC_FLUSH
}, ud = {
  flush: Je.constants.BROTLI_OPERATION_FLUSH,
  finishFlush: Je.constants.BROTLI_OPERATION_FLUSH
}, Ds = _.isFunction(Je.createBrotliDecompress), { http: pd, https: dd } = Kp, tc = /https:?/, md = ["content-type", "content-length"];
function fd(a, e, t) {
  if (t !== "content-only") {
    a.set(e);
    return;
  }
  Object.entries(e).forEach(([i, n]) => {
    md.includes(i.toLowerCase()) && a.set(i, n);
  });
}
const Is = Symbol("axios.http.socketListener"), Bt = Symbol("axios.http.currentReq"), nc = Symbol("axios.http.installedTunnel"), hd = /* @__PURE__ */ new Map(), Ps = /* @__PURE__ */ new WeakMap();
function vd(a, e) {
  const t = a.protocol + "//" + a.hostname + ":" + (a.port || "") + "#" + (a.auth || ""), i = e ? Ps.get(e) || Ps.set(e, /* @__PURE__ */ new Map()).get(e) : hd;
  let n = i.get(t);
  if (n) return n;
  const s = e && e.options ? { ...e.options, ...a } : a;
  return n = new Jo(s), n[nc] = !0, i.set(t, n), n;
}
const Fs = Te.protocols.map((a) => a + ":"), Ls = (a) => {
  if (!_.isString(a))
    return a;
  try {
    return decodeURIComponent(a);
  } catch {
    return a;
  }
}, Ns = (a, [e, t]) => (a.on("end", t).on("error", t), e);
class xd {
  constructor() {
    this.sessions = /* @__PURE__ */ Object.create(null);
  }
  getSession(e, t) {
    t = Object.assign(
      {
        sessionTimeout: 1e3
      },
      t
    );
    let i = this.sessions[e];
    if (i) {
      let m = i.length;
      for (let u = 0; u < m; u++) {
        const [d, v] = i[u];
        if (!d.destroyed && !d.closed && Qe.isDeepStrictEqual(v, t))
          return d;
      }
    }
    const n = Qs.connect(e, t);
    let s;
    const r = () => {
      if (s)
        return;
      s = !0;
      let m = i, u = m.length, d = u;
      for (; d--; )
        if (m[d][0] === n) {
          u === 1 ? delete this.sessions[e] : m.splice(d, 1), n.closed || n.close();
          return;
        }
    }, c = n.request, { sessionTimeout: l } = t;
    if (l != null) {
      let m, u = 0;
      n.request = function() {
        const d = c.apply(this, arguments);
        return u++, m && (clearTimeout(m), m = null), d.once("close", () => {
          --u || (m = setTimeout(() => {
            m = null, r();
          }, l));
        }), d;
      };
    }
    n.once("close", r);
    let p = [n, t];
    return i ? i.push(p) : i = this.sessions[e] = [p], n;
  }
}
const gd = new xd();
function yd(a, e, t) {
  a.beforeRedirects.proxy && a.beforeRedirects.proxy(a), a.beforeRedirects.config && a.beforeRedirects.config(a, e, t);
}
function ic(a, e, t, i, n) {
  let s = e;
  if (!s && s !== !1) {
    const r = Ap(t);
    r && (od(t) || (s = new URL(r)));
  }
  if (i && a.headers)
    for (const r of Object.keys(a.headers))
      r.toLowerCase() === "proxy-authorization" && delete a.headers[r];
  if (i && a.agent && a.agent[nc] && (a.agent = void 0), s) {
    const r = s instanceof URL, c = (d) => r || _.hasOwnProp(s, d) ? s[d] : void 0, l = c("username"), p = c("password");
    let m = _.hasOwnProp(s, "auth") ? s.auth : void 0;
    if (l && (m = (l || "") + ":" + (p || "")), m) {
      const d = typeof m == "object", v = d && _.hasOwnProp(m, "username") ? m.username : void 0, y = d && _.hasOwnProp(m, "password") ? m.password : void 0;
      if (!!(v || y))
        m = (v || "") + ":" + (y || "");
      else if (d)
        throw new U("Invalid proxy authorization", U.ERR_BAD_OPTION, { proxy: s });
    }
    if (tc.test(a.protocol)) {
      if (!(n instanceof Jo)) {
        const d = c("hostname") || c("host"), v = c("port"), y = c("protocol"), g = y ? y.includes(":") ? y : `${y}:` : "http:", f = d && d.includes(":") && !d.startsWith("[") ? `[${d}]` : d, h = new URL(
          `${g}//${f}${v ? ":" + v : ""}`
        ), b = {
          protocol: h.protocol,
          hostname: h.hostname.replace(/^\[|\]$/g, ""),
          port: h.port,
          auth: m && typeof m == "string" ? m : void 0
        };
        h.protocol === "https:" && (b.ALPNProtocols = ["http/1.1"]);
        const S = vd(b, n);
        a.agent = S, a.agents && (a.agents.https = S);
      }
    } else {
      if (m) {
        const g = Buffer.from(m, "utf8").toString("base64");
        a.headers["Proxy-Authorization"] = "Basic " + g;
      }
      let d = !1;
      for (const g of Object.keys(a.headers))
        if (g.toLowerCase() === "host") {
          d = !0;
          break;
        }
      d || (a.headers.host = a.hostname + (a.port ? ":" + a.port : ""));
      const v = c("hostname") || c("host");
      a.hostname = v, a.host = v, a.port = c("port"), a.path = t;
      const y = c("protocol");
      y && (a.protocol = y.includes(":") ? y : `${y}:`);
    }
  }
  a.beforeRedirects.proxy = function(c) {
    ic(c, e, c.href, !0, n);
  };
}
const bd = typeof process < "u" && _.kindOf(process) === "process", _d = (a) => new Promise((e, t) => {
  let i, n;
  const s = (l, p) => {
    n || (n = !0, i && i(l, p));
  }, r = (l) => {
    s(l), e(l);
  }, c = (l) => {
    s(l, !0), t(l);
  };
  a(r, c, (l) => i = l).catch(c);
}), wd = ({ address: a, family: e }) => {
  if (!_.isString(a))
    throw TypeError("address must be a string");
  return {
    address: a,
    family: e || (a.indexOf(".") < 0 ? 6 : 4)
  };
}, js = (a, e) => wd(_.isObject(a) ? a : { address: a, family: e }), Ed = {
  request(a, e) {
    const t = a.protocol + "//" + a.hostname + ":" + (a.port || (a.protocol === "https:" ? 443 : 80)), { http2Options: i, headers: n } = a, s = gd.getSession(t, i), { HTTP2_HEADER_SCHEME: r, HTTP2_HEADER_METHOD: c, HTTP2_HEADER_PATH: l, HTTP2_HEADER_STATUS: p } = Qs.constants, m = {
      [r]: a.protocol.replace(":", ""),
      [c]: a.method,
      [l]: a.path
    };
    _.forEach(n, (d, v) => {
      v.charAt(0) !== ":" && (m[v] = d);
    });
    const u = s.request(m);
    return u.once("response", (d) => {
      const v = u;
      d = Object.assign({}, d);
      const y = d[p];
      delete d[p], v.headers = d, v.statusCode = +y, e(v);
    }), u;
  }
}, Sd = bd && function(e) {
  return _d(async function(i, n, s) {
    const r = (P) => _.hasOwnProp(e, P) ? e[P] : void 0;
    let c = r("data"), l = r("lookup"), p = r("family"), m = r("httpVersion");
    m === void 0 && (m = 1);
    let u = r("http2Options");
    const d = r("responseType"), v = r("responseEncoding"), y = e.method.toUpperCase();
    let g, f = !1, h, b;
    if (m = +m, Number.isNaN(m))
      throw TypeError(`Invalid protocol version: '${e.httpVersion}' is not a number`);
    if (m !== 1 && m !== 2)
      throw TypeError(`Unsupported protocol version '${m}'`);
    const S = m === 2;
    if (l) {
      const P = Zp(l, (C) => _.isArray(C) ? C : [C]);
      l = (C, $, G) => {
        P(C, $, (q, ee, ne) => {
          if (q)
            return G(q);
          const ie = _.isArray(ee) ? ee.map((ce) => js(ce)) : [js(ee, ne)];
          $.all ? G(q, ie) : G(q, ie[0].address, ie[0].family);
        });
      };
    }
    const E = new vc();
    function w(P) {
      try {
        E.emit(
          "abort",
          !P || P.type ? new nt(null, e, h) : P
        );
      } catch (C) {
        console.warn("emit error", C);
      }
    }
    function A() {
      b && (clearTimeout(b), b = null);
    }
    function O() {
      let P = e.timeout ? "timeout of " + e.timeout + "ms exceeded" : "timeout exceeded";
      const C = e.transitional || sn;
      return e.timeoutErrorMessage && (P = e.timeoutErrorMessage), new U(
        P,
        C.clarifyTimeoutError ? U.ETIMEDOUT : U.ECONNABORTED,
        e,
        h
      );
    }
    E.once("abort", n);
    const W = () => {
      A(), e.cancelToken && e.cancelToken.unsubscribe(w), e.signal && e.signal.removeEventListener("abort", w), E.removeAllListeners();
    };
    (e.cancelToken || e.signal) && (e.cancelToken && e.cancelToken.subscribe(w), e.signal && (e.signal.aborted ? w() : e.signal.addEventListener("abort", w))), s((P, C) => {
      if (g = !0, A(), C) {
        f = !0, W();
        return;
      }
      const { data: $ } = P;
      if ($ instanceof Ce.Readable || $ instanceof Ce.Duplex) {
        const G = Ce.finished($, () => {
          G(), W();
        });
      } else
        W();
    });
    const X = ya(e.baseURL, e.url, e.allowAbsoluteUrls), V = new URL(X, Te.hasBrowserEnv ? Te.origin : void 0), pe = V.protocol || Fs[0];
    if (pe === "data:") {
      if (e.maxContentLength > -1) {
        const C = String(e.url || X || "");
        if (ec(C) > e.maxContentLength)
          return n(
            new U(
              "maxContentLength size of " + e.maxContentLength + " exceeded",
              U.ERR_BAD_RESPONSE,
              e
            )
          );
      }
      let P;
      if (y !== "GET")
        return ot(i, n, {
          status: 405,
          statusText: "method not allowed",
          headers: {},
          config: e
        });
      try {
        P = Yp(e.url, d === "blob", {
          Blob: e.env && e.env.Blob
        });
      } catch (C) {
        throw U.from(C, U.ERR_BAD_REQUEST, e);
      }
      return d === "text" ? (P = P.toString(v), (!v || v === "utf8") && (P = _.stripBOM(P))) : d === "stream" && (P = Ce.Readable.from(P)), ot(i, n, {
        data: P,
        status: 200,
        statusText: "OK",
        headers: new Oe(),
        config: e
      });
    }
    if (Fs.indexOf(pe) === -1)
      return n(
        new U("Unsupported protocol " + pe, U.ERR_BAD_REQUEST, e)
      );
    const me = Oe.from(e.headers).normalize();
    me.set("User-Agent", "axios/" + yt, !1);
    const { onUploadProgress: ke, onDownloadProgress: le } = e, fe = e.maxRate;
    let he, we;
    if (_.isSpecCompliantForm(c)) {
      const P = me.getContentType(/boundary=([-_\w\d]{10,70})/i);
      c = Xp(
        c,
        (C) => {
          me.set(C);
        },
        {
          tag: `axios-${yt}-boundary`,
          boundary: P && P[1] || void 0
        }
      );
    } else if (_.isFormData(c) && _.isFunction(c.getHeaders) && c.getHeaders !== Object.prototype.getHeaders) {
      if (fd(me, c.getHeaders(), r("formDataHeaderPolicy")), !me.hasContentLength())
        try {
          const P = await Qe.promisify(c.getLength).call(c);
          Number.isFinite(P) && P >= 0 && me.setContentLength(P);
        } catch {
        }
    } else if (_.isBlob(c) || _.isFile(c))
      c.size && me.setContentType(c.type || "application/octet-stream"), me.setContentLength(c.size || 0), c = Ce.Readable.from(Qo(c));
    else if (c && !_.isStream(c)) {
      if (!Buffer.isBuffer(c)) if (_.isArrayBuffer(c))
        c = Buffer.from(new Uint8Array(c));
      else if (_.isString(c))
        c = Buffer.from(c, "utf-8");
      else
        return n(
          new U(
            "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
            U.ERR_BAD_REQUEST,
            e
          )
        );
      if (me.setContentLength(c.length, !1), e.maxBodyLength > -1 && c.length > e.maxBodyLength)
        return n(
          new U(
            "Request body larger than maxBodyLength limit",
            U.ERR_BAD_REQUEST,
            e
          )
        );
    }
    const J = _.toFiniteNumber(me.getContentLength());
    _.isArray(fe) ? (he = fe[0], we = fe[1]) : he = we = fe, c && (ke || he) && (_.isStream(c) || (c = Ce.Readable.from(c, { objectMode: !1 })), c = Ce.pipeline(
      [
        c,
        new ks({
          maxRate: _.toFiniteNumber(he)
        })
      ],
      _.noop
    ), ke && c.on(
      "progress",
      Ns(
        c,
        Wt(
          J,
          lt(Gt(ke), !1, 3)
        )
      )
    ));
    let k;
    const M = r("auth");
    if (M) {
      const P = M.username || "", C = M.password || "";
      k = P + ":" + C;
    }
    if (!k && V.username) {
      const P = Ls(V.username), C = Ls(V.password);
      k = P + ":" + C;
    }
    k && me.delete("authorization");
    let z;
    try {
      z = xa(
        V.pathname + V.search,
        e.params,
        e.paramsSerializer
      ).replace(/^\?/, "");
    } catch (P) {
      const C = new Error(P.message);
      return C.config = e, C.url = e.url, C.exists = !0, n(C);
    }
    me.set(
      "Accept-Encoding",
      "gzip, compress, deflate" + (Ds ? ", br" : ""),
      !1
    );
    const Z = Object.assign(/* @__PURE__ */ Object.create(null), {
      path: z,
      method: y,
      headers: ma(me),
      agents: { http: e.httpAgent, https: e.httpsAgent },
      auth: k,
      protocol: pe,
      family: p,
      beforeRedirect: yd,
      beforeRedirects: /* @__PURE__ */ Object.create(null),
      http2Options: u
    });
    if (!_.isUndefined(l) && (Z.lookup = l), e.socketPath) {
      if (typeof e.socketPath != "string")
        return n(
          new U("socketPath must be a string", U.ERR_BAD_OPTION_VALUE, e)
        );
      if (e.allowedSocketPaths != null) {
        const P = Array.isArray(e.allowedSocketPaths) ? e.allowedSocketPaths : [e.allowedSocketPaths], C = Sa(e.socketPath);
        if (!P.some(
          (G) => typeof G == "string" && Sa(G) === C
        ))
          return n(
            new U(
              `socketPath "${e.socketPath}" is not permitted by allowedSocketPaths`,
              U.ERR_BAD_OPTION_VALUE,
              e
            )
          );
      }
      Z.socketPath = e.socketPath;
    } else
      Z.hostname = V.hostname.startsWith("[") ? V.hostname.slice(1, -1) : V.hostname, Z.port = V.port, ic(
        Z,
        e.proxy,
        pe + "//" + V.hostname + (V.port ? ":" + V.port : "") + Z.path,
        !1,
        e.httpsAgent
      );
    let re, de = !1;
    const Y = tc.test(Z.protocol);
    if (Z.agent == null && (Z.agent = Y ? e.httpsAgent : e.httpAgent), S)
      re = Ed;
    else {
      const P = r("transport");
      if (P)
        re = P;
      else if (e.maxRedirects === 0)
        re = Y ? oa : sa, de = !0;
      else {
        e.maxRedirects && (Z.maxRedirects = e.maxRedirects);
        const C = r("beforeRedirect");
        C && (Z.beforeRedirects.config = C), re = Y ? dd : pd;
      }
    }
    e.maxBodyLength > -1 ? Z.maxBodyLength = e.maxBodyLength : Z.maxBodyLength = 1 / 0, Z.insecureHTTPParser = !!r("insecureHTTPParser"), h = re.request(Z, function(C) {
      if (A(), h.destroyed) return;
      const $ = [C], G = _.toFiniteNumber(C.headers["content-length"]);
      if (le || we) {
        const ie = new ks({
          maxRate: _.toFiniteNumber(we)
        });
        le && ie.on(
          "progress",
          Ns(
            ie,
            Wt(
              G,
              lt(Gt(le), !0, 3)
            )
          )
        ), $.push(ie);
      }
      let q = C;
      const ee = C.req || h;
      if (e.decompress !== !1 && C.headers["content-encoding"])
        switch ((y === "HEAD" || C.statusCode === 204) && delete C.headers["content-encoding"], (C.headers["content-encoding"] || "").toLowerCase()) {
          /*eslint default-case:0*/
          case "gzip":
          case "x-gzip":
          case "compress":
          case "x-compress":
            $.push(Je.createUnzip(Os)), delete C.headers["content-encoding"];
            break;
          case "deflate":
            $.push(new Qp()), $.push(Je.createUnzip(Os)), delete C.headers["content-encoding"];
            break;
          case "br":
            Ds && ($.push(Je.createBrotliDecompress(ud)), delete C.headers["content-encoding"]);
        }
      q = $.length > 1 ? Ce.pipeline($, _.noop) : $[0];
      const ne = {
        status: C.statusCode,
        statusText: C.statusMessage,
        headers: new Oe(C.headers),
        config: e,
        request: ee
      };
      if (d === "stream") {
        if (e.maxContentLength > -1) {
          const ie = e.maxContentLength, ce = q;
          async function* _e() {
            let be = 0;
            for await (const qe of ce) {
              if (be += qe.length, be > ie)
                throw new U(
                  "maxContentLength size of " + ie + " exceeded",
                  U.ERR_BAD_RESPONSE,
                  e,
                  ee
                );
              yield qe;
            }
          }
          q = Ce.Readable.from(_e(), {
            objectMode: !1
          });
        }
        ne.data = q, ot(i, n, ne);
      } else {
        const ie = [];
        let ce = 0;
        q.on("data", function(be) {
          ie.push(be), ce += be.length, e.maxContentLength > -1 && ce > e.maxContentLength && (f = !0, q.destroy(), w(
            new U(
              "maxContentLength size of " + e.maxContentLength + " exceeded",
              U.ERR_BAD_RESPONSE,
              e,
              ee
            )
          ));
        }), q.on("aborted", function() {
          if (f)
            return;
          const be = new U(
            "stream has been aborted",
            U.ERR_BAD_RESPONSE,
            e,
            ee,
            ne
          );
          q.destroy(be), n(be);
        }), q.on("error", function(be) {
          f || n(U.from(be, null, e, ee, ne));
        }), q.on("end", function() {
          try {
            let be = ie.length === 1 ? ie[0] : Buffer.concat(ie);
            d !== "arraybuffer" && (be = be.toString(v), (!v || v === "utf8") && (be = _.stripBOM(be))), ne.data = be;
          } catch (be) {
            return n(U.from(be, null, e, ne.request, ne));
          }
          ot(i, n, ne);
        });
      }
      E.once("abort", (ie) => {
        q.destroyed || (q.emit("error", ie), q.destroy());
      });
    }), E.once("abort", (P) => {
      h.close ? h.close() : h.destroy(P);
    }), h.on("error", function(C) {
      n(U.from(C, null, e, h));
    });
    const se = /* @__PURE__ */ new Set();
    if (h.on("socket", function(C) {
      C.setKeepAlive(!0, 1e3 * 60), C[Is] || (C.on("error", function(G) {
        const q = C[Bt];
        q && !q.destroyed && q.destroy(G);
      }), C[Is] = !0), C[Bt] = h, se.add(C);
    }), h.once("close", function() {
      A();
      for (const C of se)
        C[Bt] === h && (C[Bt] = null);
      se.clear();
    }), e.timeout) {
      const P = parseInt(e.timeout, 10);
      if (Number.isNaN(P)) {
        w(
          new U(
            "error trying to parse `config.timeout` to int",
            U.ERR_BAD_OPTION_VALUE,
            e,
            h
          )
        );
        return;
      }
      const C = function() {
        g || w(O());
      };
      de && P > 0 && (b = setTimeout(C, P)), h.setTimeout(P, C);
    } else
      h.setTimeout(0);
    if (_.isStream(c)) {
      let P = !1, C = !1;
      c.on("end", () => {
        P = !0;
      }), c.once("error", (G) => {
        C = !0, h.destroy(G);
      }), c.on("close", () => {
        !P && !C && w(new nt("Request stream has been aborted", e, h));
      });
      let $ = c;
      if (e.maxBodyLength > -1 && e.maxRedirects === 0) {
        const G = e.maxBodyLength;
        let q = 0;
        $ = Ce.pipeline(
          [
            c,
            new Ce.Transform({
              transform(ee, ne, ie) {
                if (q += ee.length, q > G)
                  return ie(
                    new U(
                      "Request body larger than maxBodyLength limit",
                      U.ERR_BAD_REQUEST,
                      e,
                      h
                    )
                  );
                ie(null, ee);
              }
            })
          ],
          _.noop
        ), $.on("error", (ee) => {
          h.destroyed || h.destroy(ee);
        });
      }
      $.pipe(h);
    } else
      c && h.write(c), h.end();
  });
}, Rd = Te.hasStandardBrowserEnv ? /* @__PURE__ */ ((a, e) => (t) => (t = new URL(t, Te.origin), a.protocol === t.protocol && a.host === t.host && (e || a.port === t.port)))(
  new URL(Te.origin),
  Te.navigator && /(msie|trident)/i.test(Te.navigator.userAgent)
) : () => !0, kd = Te.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(a, e, t, i, n, s, r) {
      if (typeof document > "u") return;
      const c = [`${a}=${encodeURIComponent(e)}`];
      _.isNumber(t) && c.push(`expires=${new Date(t).toUTCString()}`), _.isString(i) && c.push(`path=${i}`), _.isString(n) && c.push(`domain=${n}`), s === !0 && c.push("secure"), _.isString(r) && c.push(`SameSite=${r}`), document.cookie = c.join("; ");
    },
    read(a) {
      if (typeof document > "u") return null;
      const e = document.cookie.split(";");
      for (let t = 0; t < e.length; t++) {
        const i = e[t].replace(/^\s+/, ""), n = i.indexOf("=");
        if (n !== -1 && i.slice(0, n) === a)
          return decodeURIComponent(i.slice(n + 1));
      }
      return null;
    },
    remove(a) {
      this.write(a, "", Date.now() - 864e5, "/");
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
), Ms = (a) => a instanceof Oe ? { ...a } : a;
function it(a, e) {
  e = e || {};
  const t = /* @__PURE__ */ Object.create(null);
  Object.defineProperty(t, "hasOwnProperty", {
    // Null-proto descriptor so a polluted Object.prototype.get cannot turn
    // this data descriptor into an accessor descriptor on the way in.
    __proto__: null,
    value: Object.prototype.hasOwnProperty,
    enumerable: !1,
    writable: !0,
    configurable: !0
  });
  function i(p, m, u, d) {
    return _.isPlainObject(p) && _.isPlainObject(m) ? _.merge.call({ caseless: d }, p, m) : _.isPlainObject(m) ? _.merge({}, m) : _.isArray(m) ? m.slice() : m;
  }
  function n(p, m, u, d) {
    if (_.isUndefined(m)) {
      if (!_.isUndefined(p))
        return i(void 0, p, u, d);
    } else return i(p, m, u, d);
  }
  function s(p, m) {
    if (!_.isUndefined(m))
      return i(void 0, m);
  }
  function r(p, m) {
    if (_.isUndefined(m)) {
      if (!_.isUndefined(p))
        return i(void 0, p);
    } else return i(void 0, m);
  }
  function c(p, m, u) {
    if (_.hasOwnProp(e, u))
      return i(p, m);
    if (_.hasOwnProp(a, u))
      return i(void 0, p);
  }
  const l = {
    url: s,
    method: s,
    data: s,
    baseURL: r,
    transformRequest: r,
    transformResponse: r,
    paramsSerializer: r,
    timeout: r,
    timeoutMessage: r,
    withCredentials: r,
    withXSRFToken: r,
    adapter: r,
    responseType: r,
    xsrfCookieName: r,
    xsrfHeaderName: r,
    onUploadProgress: r,
    onDownloadProgress: r,
    decompress: r,
    maxContentLength: r,
    maxBodyLength: r,
    beforeRedirect: r,
    transport: r,
    httpAgent: r,
    httpsAgent: r,
    cancelToken: r,
    socketPath: r,
    allowedSocketPaths: r,
    responseEncoding: r,
    validateStatus: c,
    headers: (p, m, u) => n(Ms(p), Ms(m), u, !0)
  };
  return _.forEach(Object.keys({ ...a, ...e }), function(m) {
    if (m === "__proto__" || m === "constructor" || m === "prototype") return;
    const u = _.hasOwnProp(l, m) ? l[m] : n, d = _.hasOwnProp(a, m) ? a[m] : void 0, v = _.hasOwnProp(e, m) ? e[m] : void 0, y = u(d, v, m);
    _.isUndefined(y) && u !== c || (t[m] = y);
  }), t;
}
const Td = ["content-type", "content-length"];
function Ad(a, e, t) {
  if (t !== "content-only") {
    a.set(e);
    return;
  }
  Object.entries(e).forEach(([i, n]) => {
    Td.includes(i.toLowerCase()) && a.set(i, n);
  });
}
const Cd = (a) => encodeURIComponent(a).replace(
  /%([0-9A-F]{2})/gi,
  (e, t) => String.fromCharCode(parseInt(t, 16))
), ac = (a) => {
  const e = it({}, a), t = (d) => _.hasOwnProp(e, d) ? e[d] : void 0, i = t("data");
  let n = t("withXSRFToken");
  const s = t("xsrfHeaderName"), r = t("xsrfCookieName");
  let c = t("headers");
  const l = t("auth"), p = t("baseURL"), m = t("allowAbsoluteUrls"), u = t("url");
  if (e.headers = c = Oe.from(c), e.url = xa(
    ya(p, u, m),
    a.params,
    a.paramsSerializer
  ), l && c.set(
    "Authorization",
    "Basic " + btoa((l.username || "") + ":" + (l.password ? Cd(l.password) : ""))
  ), _.isFormData(i) && (Te.hasStandardBrowserEnv || Te.hasStandardBrowserWebWorkerEnv ? c.setContentType(void 0) : _.isFunction(i.getHeaders) && Ad(c, i.getHeaders(), t("formDataHeaderPolicy"))), Te.hasStandardBrowserEnv && (_.isFunction(n) && (n = n(e)), n === !0 || n == null && Rd(e.url))) {
    const v = s && r && kd.read(r);
    v && c.set(s, v);
  }
  return e;
}, Od = typeof XMLHttpRequest < "u", Dd = Od && function(a) {
  return new Promise(function(t, i) {
    const n = ac(a);
    let s = n.data;
    const r = Oe.from(n.headers).normalize();
    let { responseType: c, onUploadProgress: l, onDownloadProgress: p } = n, m, u, d, v, y;
    function g() {
      v && v(), y && y(), n.cancelToken && n.cancelToken.unsubscribe(m), n.signal && n.signal.removeEventListener("abort", m);
    }
    let f = new XMLHttpRequest();
    f.open(n.method.toUpperCase(), n.url, !0), f.timeout = n.timeout;
    function h() {
      if (!f)
        return;
      const S = Oe.from(
        "getAllResponseHeaders" in f && f.getAllResponseHeaders()
      ), w = {
        data: !c || c === "text" || c === "json" ? f.responseText : f.response,
        status: f.status,
        statusText: f.statusText,
        headers: S,
        config: a,
        request: f
      };
      ot(
        function(O) {
          t(O), g();
        },
        function(O) {
          i(O), g();
        },
        w
      ), f = null;
    }
    "onloadend" in f ? f.onloadend = h : f.onreadystatechange = function() {
      !f || f.readyState !== 4 || f.status === 0 && !(f.responseURL && f.responseURL.startsWith("file:")) || setTimeout(h);
    }, f.onabort = function() {
      f && (i(new U("Request aborted", U.ECONNABORTED, a, f)), g(), f = null);
    }, f.onerror = function(E) {
      const w = E && E.message ? E.message : "Network Error", A = new U(w, U.ERR_NETWORK, a, f);
      A.event = E || null, i(A), g(), f = null;
    }, f.ontimeout = function() {
      let E = n.timeout ? "timeout of " + n.timeout + "ms exceeded" : "timeout exceeded";
      const w = n.transitional || sn;
      n.timeoutErrorMessage && (E = n.timeoutErrorMessage), i(
        new U(
          E,
          w.clarifyTimeoutError ? U.ETIMEDOUT : U.ECONNABORTED,
          a,
          f
        )
      ), g(), f = null;
    }, s === void 0 && r.setContentType(null), "setRequestHeader" in f && _.forEach(ma(r), function(E, w) {
      f.setRequestHeader(w, E);
    }), _.isUndefined(n.withCredentials) || (f.withCredentials = !!n.withCredentials), c && c !== "json" && (f.responseType = n.responseType), p && ([d, y] = lt(p, !0), f.addEventListener("progress", d)), l && f.upload && ([u, v] = lt(l), f.upload.addEventListener("progress", u), f.upload.addEventListener("loadend", v)), (n.cancelToken || n.signal) && (m = (S) => {
      f && (i(!S || S.type ? new nt(null, a, f) : S), f.abort(), g(), f = null);
    }, n.cancelToken && n.cancelToken.subscribe(m), n.signal && (n.signal.aborted ? m() : n.signal.addEventListener("abort", m)));
    const b = Xo(n.url);
    if (b && !Te.protocols.includes(b)) {
      i(
        new U(
          "Unsupported protocol " + b + ":",
          U.ERR_BAD_REQUEST,
          a
        )
      );
      return;
    }
    f.send(s || null);
  });
}, Id = (a, e) => {
  if (a = a ? a.filter(Boolean) : [], !e && !a.length)
    return;
  const t = new AbortController();
  let i = !1;
  const n = function(l) {
    if (!i) {
      i = !0, r();
      const p = l instanceof Error ? l : this.reason;
      t.abort(
        p instanceof U ? p : new nt(p instanceof Error ? p.message : p)
      );
    }
  };
  let s = e && setTimeout(() => {
    s = null, n(new U(`timeout of ${e}ms exceeded`, U.ETIMEDOUT));
  }, e);
  const r = () => {
    a && (s && clearTimeout(s), s = null, a.forEach((l) => {
      l.unsubscribe ? l.unsubscribe(n) : l.removeEventListener("abort", n);
    }), a = null);
  };
  a.forEach((l) => l.addEventListener("abort", n));
  const { signal: c } = t;
  return c.unsubscribe = () => _.asap(r), c;
}, Pd = function* (a, e) {
  let t = a.byteLength;
  if (t < e) {
    yield a;
    return;
  }
  let i = 0, n;
  for (; i < t; )
    n = i + e, yield a.slice(i, n), i = n;
}, Fd = async function* (a, e) {
  for await (const t of Ld(a))
    yield* Pd(t, e);
}, Ld = async function* (a) {
  if (a[Symbol.asyncIterator]) {
    yield* a;
    return;
  }
  const e = a.getReader();
  try {
    for (; ; ) {
      const { done: t, value: i } = await e.read();
      if (t)
        break;
      yield i;
    }
  } finally {
    await e.cancel();
  }
}, Us = (a, e, t, i) => {
  const n = Fd(a, e);
  let s = 0, r, c = (l) => {
    r || (r = !0, i && i(l));
  };
  return new ReadableStream(
    {
      async pull(l) {
        try {
          const { done: p, value: m } = await n.next();
          if (p) {
            c(), l.close();
            return;
          }
          let u = m.byteLength;
          if (t) {
            let d = s += u;
            t(d);
          }
          l.enqueue(new Uint8Array(m));
        } catch (p) {
          throw c(p), p;
        }
      },
      cancel(l) {
        return c(l), n.return();
      }
    },
    {
      highWaterMark: 2
    }
  );
}, qs = 64 * 1024, { isFunction: Ht } = _, Bs = (a, ...e) => {
  try {
    return !!a(...e);
  } catch {
    return !1;
  }
}, Nd = (a) => {
  const e = _.global !== void 0 && _.global !== null ? _.global : globalThis, { ReadableStream: t, TextEncoder: i } = e;
  a = _.merge.call(
    {
      skipUndefined: !0
    },
    {
      Request: e.Request,
      Response: e.Response
    },
    a
  );
  const { fetch: n, Request: s, Response: r } = a, c = n ? Ht(n) : typeof fetch == "function", l = Ht(s), p = Ht(r);
  if (!c)
    return !1;
  const m = c && Ht(t), u = c && (typeof i == "function" ? /* @__PURE__ */ ((h) => (b) => h.encode(b))(new i()) : async (h) => new Uint8Array(await new s(h).arrayBuffer())), d = l && m && Bs(() => {
    let h = !1;
    const b = new s(Te.origin, {
      body: new t(),
      method: "POST",
      get duplex() {
        return h = !0, "half";
      }
    }), S = b.headers.has("Content-Type");
    return b.body != null && b.body.cancel(), h && !S;
  }), v = p && m && Bs(() => _.isReadableStream(new r("").body)), y = {
    stream: v && ((h) => h.body)
  };
  c && ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((h) => {
    !y[h] && (y[h] = (b, S) => {
      let E = b && b[h];
      if (E)
        return E.call(b);
      throw new U(
        `Response type '${h}' is not supported`,
        U.ERR_NOT_SUPPORT,
        S
      );
    });
  });
  const g = async (h) => {
    if (h == null)
      return 0;
    if (_.isBlob(h))
      return h.size;
    if (_.isSpecCompliantForm(h))
      return (await new s(Te.origin, {
        method: "POST",
        body: h
      }).arrayBuffer()).byteLength;
    if (_.isArrayBufferView(h) || _.isArrayBuffer(h))
      return h.byteLength;
    if (_.isURLSearchParams(h) && (h = h + ""), _.isString(h))
      return (await u(h)).byteLength;
  }, f = async (h, b) => {
    const S = _.toFiniteNumber(h.getContentLength());
    return S ?? g(b);
  };
  return async (h) => {
    let {
      url: b,
      method: S,
      data: E,
      signal: w,
      cancelToken: A,
      timeout: O,
      onDownloadProgress: W,
      onUploadProgress: X,
      responseType: V,
      headers: pe,
      withCredentials: me = "same-origin",
      fetchOptions: ke,
      maxContentLength: le,
      maxBodyLength: fe
    } = ac(h);
    const he = _.isNumber(le) && le > -1, we = _.isNumber(fe) && fe > -1;
    let J = n || fetch;
    V = V ? (V + "").toLowerCase() : "text";
    let k = Id(
      [w, A && A.toAbortSignal()],
      O
    ), M = null;
    const z = k && k.unsubscribe && (() => {
      k.unsubscribe();
    });
    let Z;
    try {
      if (he && typeof b == "string" && b.startsWith("data:") && ec(b) > le)
        throw new U(
          "maxContentLength size of " + le + " exceeded",
          U.ERR_BAD_RESPONSE,
          h,
          M
        );
      if (we && S !== "get" && S !== "head") {
        const C = await f(pe, E);
        if (typeof C == "number" && isFinite(C) && C > fe)
          throw new U(
            "Request body larger than maxBodyLength limit",
            U.ERR_BAD_REQUEST,
            h,
            M
          );
      }
      if (X && d && S !== "get" && S !== "head" && (Z = await f(pe, E)) !== 0) {
        let C = new s(b, {
          method: "POST",
          body: E,
          duplex: "half"
        }), $;
        if (_.isFormData(E) && ($ = C.headers.get("content-type")) && pe.setContentType($), C.body) {
          const [G, q] = Wt(
            Z,
            lt(Gt(X))
          );
          E = Us(C.body, qs, G, q);
        }
      }
      _.isString(me) || (me = me ? "include" : "omit");
      const re = l && "credentials" in s.prototype;
      if (_.isFormData(E)) {
        const C = pe.getContentType();
        C && /^multipart\/form-data/i.test(C) && !/boundary=/i.test(C) && pe.delete("content-type");
      }
      pe.set("User-Agent", "axios/" + yt, !1);
      const de = {
        ...ke,
        signal: k,
        method: S.toUpperCase(),
        headers: ma(pe.normalize()),
        body: E,
        duplex: "half",
        credentials: re ? me : void 0
      };
      M = l && new s(b, de);
      let Y = await (l ? J(M, ke) : J(b, de));
      if (he) {
        const C = _.toFiniteNumber(Y.headers.get("content-length"));
        if (C != null && C > le)
          throw new U(
            "maxContentLength size of " + le + " exceeded",
            U.ERR_BAD_RESPONSE,
            h,
            M
          );
      }
      const se = v && (V === "stream" || V === "response");
      if (v && Y.body && (W || he || se && z)) {
        const C = {};
        ["status", "statusText", "headers"].forEach((ie) => {
          C[ie] = Y[ie];
        });
        const $ = _.toFiniteNumber(Y.headers.get("content-length")), [G, q] = W && Wt(
          $,
          lt(Gt(W), !0)
        ) || [];
        let ee = 0;
        const ne = (ie) => {
          if (he && (ee = ie, ee > le))
            throw new U(
              "maxContentLength size of " + le + " exceeded",
              U.ERR_BAD_RESPONSE,
              h,
              M
            );
          G && G(ie);
        };
        Y = new r(
          Us(Y.body, qs, ne, () => {
            q && q(), z && z();
          }),
          C
        );
      }
      V = V || "text";
      let P = await y[_.findKey(y, V) || "text"](
        Y,
        h
      );
      if (he && !v && !se) {
        let C;
        if (P != null && (typeof P.byteLength == "number" ? C = P.byteLength : typeof P.size == "number" ? C = P.size : typeof P == "string" && (C = typeof i == "function" ? new i().encode(P).byteLength : P.length)), typeof C == "number" && C > le)
          throw new U(
            "maxContentLength size of " + le + " exceeded",
            U.ERR_BAD_RESPONSE,
            h,
            M
          );
      }
      return !se && z && z(), await new Promise((C, $) => {
        ot(C, $, {
          data: P,
          headers: Oe.from(Y.headers),
          status: Y.status,
          statusText: Y.statusText,
          config: h,
          request: M
        });
      });
    } catch (re) {
      if (z && z(), k && k.aborted && k.reason instanceof U) {
        const de = k.reason;
        throw de.config = h, M && (de.request = M), re !== de && (de.cause = re), de;
      }
      throw re && re.name === "TypeError" && /Load failed|fetch/i.test(re.message) ? Object.assign(
        new U(
          "Network Error",
          U.ERR_NETWORK,
          h,
          M,
          re && re.response
        ),
        {
          cause: re.cause || re
        }
      ) : U.from(re, re && re.code, h, M, re && re.response);
    }
  };
}, jd = /* @__PURE__ */ new Map(), rc = (a) => {
  let e = a && a.env || {};
  const { fetch: t, Request: i, Response: n } = e, s = [i, n, t];
  let r = s.length, c = r, l, p, m = jd;
  for (; c--; )
    l = s[c], p = m.get(l), p === void 0 && m.set(l, p = c ? /* @__PURE__ */ new Map() : Nd(e)), m = p;
  return p;
};
rc();
const ba = {
  http: Sd,
  xhr: Dd,
  fetch: {
    get: rc
  }
};
_.forEach(ba, (a, e) => {
  if (a) {
    try {
      Object.defineProperty(a, "name", { __proto__: null, value: e });
    } catch {
    }
    Object.defineProperty(a, "adapterName", { __proto__: null, value: e });
  }
});
const Hs = (a) => `- ${a}`, Md = (a) => _.isFunction(a) || a === null || a === !1;
function Ud(a, e) {
  a = _.isArray(a) ? a : [a];
  const { length: t } = a;
  let i, n;
  const s = {};
  for (let r = 0; r < t; r++) {
    i = a[r];
    let c;
    if (n = i, !Md(i) && (n = ba[(c = String(i)).toLowerCase()], n === void 0))
      throw new U(`Unknown adapter '${c}'`);
    if (n && (_.isFunction(n) || (n = n.get(e))))
      break;
    s[c || "#" + r] = n;
  }
  if (!n) {
    const r = Object.entries(s).map(
      ([l, p]) => `adapter ${l} ` + (p === !1 ? "is not supported by the environment" : "is not available in the build")
    );
    let c = t ? r.length > 1 ? `since :
` + r.map(Hs).join(`
`) : " " + Hs(r[0]) : "as no adapter specified";
    throw new U(
      "There is no suitable adapter to dispatch the request " + c,
      "ERR_NOT_SUPPORT"
    );
  }
  return n;
}
const sc = {
  /**
   * Resolve an adapter from a list of adapter names or functions.
   * @type {Function}
   */
  getAdapter: Ud,
  /**
   * Exposes all known adapters
   * @type {Object<string, Function|Object>}
   */
  adapters: ba
};
function Xi(a) {
  if (a.cancelToken && a.cancelToken.throwIfRequested(), a.signal && a.signal.aborted)
    throw new nt(null, a);
}
function $s(a) {
  return Xi(a), a.headers = Oe.from(a.headers), a.data = Ki.call(a, a.transformRequest), ["post", "put", "patch"].indexOf(a.method) !== -1 && a.headers.setContentType("application/x-www-form-urlencoded", !1), sc.getAdapter(a.adapter || Tt.adapter, a)(a).then(
    function(i) {
      Xi(a), a.response = i;
      try {
        i.data = Ki.call(a, a.transformResponse, i);
      } finally {
        delete a.response;
      }
      return i.headers = Oe.from(i.headers), i;
    },
    function(i) {
      if (!Go(i) && (Xi(a), i && i.response)) {
        a.response = i.response;
        try {
          i.response.data = Ki.call(
            a,
            a.transformResponse,
            i.response
          );
        } finally {
          delete a.response;
        }
        i.response.headers = Oe.from(i.response.headers);
      }
      return Promise.reject(i);
    }
  );
}
const cn = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((a, e) => {
  cn[a] = function(i) {
    return typeof i === a || "a" + (e < 1 ? "n " : " ") + a;
  };
});
const Ks = {};
cn.transitional = function(e, t, i) {
  function n(s, r) {
    return "[Axios v" + yt + "] Transitional option '" + s + "'" + r + (i ? ". " + i : "");
  }
  return (s, r, c) => {
    if (e === !1)
      throw new U(
        n(r, " has been removed" + (t ? " in " + t : "")),
        U.ERR_DEPRECATED
      );
    return t && !Ks[r] && (Ks[r] = !0, console.warn(
      n(
        r,
        " has been deprecated since v" + t + " and will be removed in the near future"
      )
    )), e ? e(s, r, c) : !0;
  };
};
cn.spelling = function(e) {
  return (t, i) => (console.warn(`${i} is likely a misspelling of ${e}`), !0);
};
function qd(a, e, t) {
  if (typeof a != "object")
    throw new U("options must be an object", U.ERR_BAD_OPTION_VALUE);
  const i = Object.keys(a);
  let n = i.length;
  for (; n-- > 0; ) {
    const s = i[n], r = Object.prototype.hasOwnProperty.call(e, s) ? e[s] : void 0;
    if (r) {
      const c = a[s], l = c === void 0 || r(c, s, a);
      if (l !== !0)
        throw new U(
          "option " + s + " must be " + l,
          U.ERR_BAD_OPTION_VALUE
        );
      continue;
    }
    if (t !== !0)
      throw new U("Unknown option " + s, U.ERR_BAD_OPTION);
  }
}
const Yt = {
  assertOptions: qd,
  validators: cn
}, Ue = Yt.validators;
let tt = class {
  constructor(e) {
    this.defaults = e || {}, this.interceptors = {
      request: new us(),
      response: new us()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(e, t) {
    try {
      return await this._request(e, t);
    } catch (i) {
      if (i instanceof Error) {
        let n = {};
        Error.captureStackTrace ? Error.captureStackTrace(n) : n = new Error();
        const s = (() => {
          if (!n.stack)
            return "";
          const r = n.stack.indexOf(`
`);
          return r === -1 ? "" : n.stack.slice(r + 1);
        })();
        try {
          if (!i.stack)
            i.stack = s;
          else if (s) {
            const r = s.indexOf(`
`), c = r === -1 ? -1 : s.indexOf(`
`, r + 1), l = c === -1 ? "" : s.slice(c + 1);
            String(i.stack).endsWith(l) || (i.stack += `
` + s);
          }
        } catch {
        }
      }
      throw i;
    }
  }
  _request(e, t) {
    typeof e == "string" ? (t = t || {}, t.url = e) : t = e || {}, t = it(this.defaults, t);
    const { transitional: i, paramsSerializer: n, headers: s } = t;
    i !== void 0 && Yt.assertOptions(
      i,
      {
        silentJSONParsing: Ue.transitional(Ue.boolean),
        forcedJSONParsing: Ue.transitional(Ue.boolean),
        clarifyTimeoutError: Ue.transitional(Ue.boolean),
        legacyInterceptorReqResOrdering: Ue.transitional(Ue.boolean)
      },
      !1
    ), n != null && (_.isFunction(n) ? t.paramsSerializer = {
      serialize: n
    } : Yt.assertOptions(
      n,
      {
        encode: Ue.function,
        serialize: Ue.function
      },
      !0
    )), t.allowAbsoluteUrls !== void 0 || (this.defaults.allowAbsoluteUrls !== void 0 ? t.allowAbsoluteUrls = this.defaults.allowAbsoluteUrls : t.allowAbsoluteUrls = !0), Yt.assertOptions(
      t,
      {
        baseUrl: Ue.spelling("baseURL"),
        withXsrfToken: Ue.spelling("withXSRFToken")
      },
      !0
    ), t.method = (t.method || this.defaults.method || "get").toLowerCase();
    let r = s && _.merge(s.common, s[t.method]);
    s && _.forEach(["delete", "get", "head", "post", "put", "patch", "query", "common"], (y) => {
      delete s[y];
    }), t.headers = Oe.concat(r, s);
    const c = [];
    let l = !0;
    this.interceptors.request.forEach(function(g) {
      if (typeof g.runWhen == "function" && g.runWhen(t) === !1)
        return;
      l = l && g.synchronous;
      const f = t.transitional || sn;
      f && f.legacyInterceptorReqResOrdering ? c.unshift(g.fulfilled, g.rejected) : c.push(g.fulfilled, g.rejected);
    });
    const p = [];
    this.interceptors.response.forEach(function(g) {
      p.push(g.fulfilled, g.rejected);
    });
    let m, u = 0, d;
    if (!l) {
      const y = [$s.bind(this), void 0];
      for (y.unshift(...c), y.push(...p), d = y.length, m = Promise.resolve(t); u < d; )
        m = m.then(y[u++], y[u++]);
      return m;
    }
    d = c.length;
    let v = t;
    for (; u < d; ) {
      const y = c[u++], g = c[u++];
      try {
        v = y(v);
      } catch (f) {
        g.call(this, f);
        break;
      }
    }
    try {
      m = $s.call(this, v);
    } catch (y) {
      return Promise.reject(y);
    }
    for (u = 0, d = p.length; u < d; )
      m = m.then(p[u++], p[u++]);
    return m;
  }
  getUri(e) {
    e = it(this.defaults, e);
    const t = ya(e.baseURL, e.url, e.allowAbsoluteUrls);
    return xa(t, e.params, e.paramsSerializer);
  }
};
_.forEach(["delete", "get", "head", "options"], function(e) {
  tt.prototype[e] = function(t, i) {
    return this.request(
      it(i || {}, {
        method: e,
        url: t,
        data: (i || {}).data
      })
    );
  };
});
_.forEach(["post", "put", "patch", "query"], function(e) {
  function t(i) {
    return function(s, r, c) {
      return this.request(
        it(c || {}, {
          method: e,
          headers: i ? {
            "Content-Type": "multipart/form-data"
          } : {},
          url: s,
          data: r
        })
      );
    };
  }
  tt.prototype[e] = t(), e !== "query" && (tt.prototype[e + "Form"] = t(!0));
});
let Bd = class oc {
  constructor(e) {
    if (typeof e != "function")
      throw new TypeError("executor must be a function.");
    let t;
    this.promise = new Promise(function(s) {
      t = s;
    });
    const i = this;
    this.promise.then((n) => {
      if (!i._listeners) return;
      let s = i._listeners.length;
      for (; s-- > 0; )
        i._listeners[s](n);
      i._listeners = null;
    }), this.promise.then = (n) => {
      let s;
      const r = new Promise((c) => {
        i.subscribe(c), s = c;
      }).then(n);
      return r.cancel = function() {
        i.unsubscribe(s);
      }, r;
    }, e(function(s, r, c) {
      i.reason || (i.reason = new nt(s, r, c), t(i.reason));
    });
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason)
      throw this.reason;
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(e) {
    if (this.reason) {
      e(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(e) : this._listeners = [e];
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(e) {
    if (!this._listeners)
      return;
    const t = this._listeners.indexOf(e);
    t !== -1 && this._listeners.splice(t, 1);
  }
  toAbortSignal() {
    const e = new AbortController(), t = (i) => {
      e.abort(i);
    };
    return this.subscribe(t), e.signal.unsubscribe = () => this.unsubscribe(t), e.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let e;
    return {
      token: new oc(function(n) {
        e = n;
      }),
      cancel: e
    };
  }
};
function Hd(a) {
  return function(t) {
    return a.apply(null, t);
  };
}
function $d(a) {
  return _.isObject(a) && a.isAxiosError === !0;
}
const ia = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
  WebServerIsDown: 521,
  ConnectionTimedOut: 522,
  OriginIsUnreachable: 523,
  TimeoutOccurred: 524,
  SslHandshakeFailed: 525,
  InvalidSslCertificate: 526
};
Object.entries(ia).forEach(([a, e]) => {
  ia[e] = a;
});
function cc(a) {
  const e = new tt(a), t = _o(tt.prototype.request, e);
  return _.extend(t, tt.prototype, e, { allOwnKeys: !0 }), _.extend(t, e, null, { allOwnKeys: !0 }), t.create = function(n) {
    return cc(it(a, n));
  }, t;
}
const Ae = cc(Tt);
Ae.Axios = tt;
Ae.CanceledError = nt;
Ae.CancelToken = Bd;
Ae.isCancel = Go;
Ae.VERSION = yt;
Ae.toFormData = rn;
Ae.AxiosError = U;
Ae.Cancel = Ae.CanceledError;
Ae.all = function(e) {
  return Promise.all(e);
};
Ae.spread = Hd;
Ae.isAxiosError = $d;
Ae.mergeConfig = it;
Ae.AxiosHeaders = Oe;
Ae.formToJSON = (a) => Wo(_.isHTMLForm(a) ? new FormData(a) : a);
Ae.getAdapter = sc.getAdapter;
Ae.HttpStatusCode = ia;
Ae.default = Ae;
const {
  Axios: jm,
  AxiosError: Mm,
  CanceledError: Um,
  isCancel: qm,
  CancelToken: Bm,
  VERSION: Hm,
  all: $m,
  Cancel: Km,
  isAxiosError: zm,
  spread: Ym,
  toFormData: Wm,
  AxiosHeaders: Gm,
  HttpStatusCode: Vm,
  formToJSON: Jm,
  getAdapter: Xm,
  mergeConfig: Qm,
  create: Zm
} = Ae, Ee = {
  mainWindow: null,
  analyzer: new vl(),
  signatureEngine: new bo(),
  hidListener: null,
  detectionEnabled: !1
};
function zs(a) {
  Ee.mainWindow = a;
}
function Kd() {
  xe.handle("dsl:parse", async (a, e) => {
    var t;
    try {
      const n = new sr().parseScript(e);
      return {
        valid: n.errors.length === 0,
        errors: n.errors.map((s) => ({
          line: s.line,
          column: s.column,
          message: s.message,
          severity: "error"
        })),
        ast: ((t = n.ast) == null ? void 0 : t.body) || null,
        compiledPreview: ""
      };
    } catch (i) {
      return {
        valid: !1,
        errors: [{ line: 1, column: 1, message: String(i), severity: "error" }],
        ast: null,
        compiledPreview: ""
      };
    }
  }), xe.handle(
    "dsl:compile",
    async (a, e, t, i) => {
      try {
        const s = new sr().parseScript(e);
        if (s.errors.length > 0)
          return {
            success: !1,
            errors: s.errors.map((u) => u.message)
          };
        if (!s.ast)
          return { success: !1, errors: ["No AST generated"] };
        let r;
        switch (t) {
          case "arduino":
            r = new pl();
            break;
          case "pico":
            r = new dl();
            break;
          case "badusb":
            r = new ml();
            break;
          case "flipper":
            r = new fl();
            break;
          default:
            return { success: !1, errors: ["Unsupported device type"] };
        }
        const c = r.generate(s.ast.body), l = i || ye.join(process.cwd(), `output.${c.fileExtension}`);
        await Xe.writeFile(l, c.code);
        const p = await Xe.stat(l), m = {
          originalScript: e,
          targetDevice: t,
          outputPath: l,
          fileHash: We.createHash("sha256").update(c.code).digest("hex"),
          compiledAt: /* @__PURE__ */ new Date(),
          paramsJson: JSON.stringify({})
        };
        return ge.addPayload(m), {
          success: !0,
          outputPath: l,
          errors: [],
          fileSize: p.size
        };
      } catch (n) {
        return { success: !1, errors: [String(n)] };
      }
    }
  ), xe.handle("detection:start", async () => {
    try {
      return Ee.hidListener || (Ee.hidListener = new El(), Ee.hidListener.on("device-attached", (a) => {
        var e;
        ge.addDevice(a), (e = Ee.mainWindow) == null || e.webContents.send("detection:device-connected", a);
      }), Ee.hidListener.on("device-detached", (a) => {
        var e;
        (e = Ee.mainWindow) == null || e.webContents.send("detection:device-disconnected", a.devicePath);
      }), Ee.hidListener.on("input-event", (a) => {
        var n, s;
        if (!Ee.detectionEnabled) return;
        const e = Ee.analyzer.processEvent(a), t = Ee.signatureEngine.match([a]), i = [...e.alerts, ...t];
        for (const r of i) {
          const c = ge.getDeviceByPath(a.devicePath);
          ge.addAlert({
            ...r,
            deviceId: c == null ? void 0 : c.id
          }), (n = Ee.mainWindow) == null || n.webContents.send("detection:alert", r);
        }
        ge.addEvent(a), (s = Ee.mainWindow) == null || s.webContents.send("detection:event", a);
      }), Ee.hidListener.startListening(), Ee.detectionEnabled = !0), !0;
    } catch (a) {
      return console.error("Failed to start detection:", a), !1;
    }
  }), xe.handle("detection:stop", async () => {
    try {
      return Ee.hidListener && (Ee.hidListener.stopListening(), Ee.hidListener = null), Ee.detectionEnabled = !1, !0;
    } catch (a) {
      return console.error("Failed to stop detection:", a), !1;
    }
  }), xe.handle("detection:status", async () => ({
    running: Ee.detectionEnabled,
    deviceCount: ge.getAllDevices().length
  })), xe.handle("detection:get-devices", async () => ge.getAllDevices()), xe.handle("detection:block-device", async (a, e) => {
    try {
      return ge.setDeviceBlocked(e, !0), !0;
    } catch {
      return !1;
    }
  }), xe.handle("detection:unblock-device", async (a, e) => {
    try {
      return ge.setDeviceBlocked(e, !1), !0;
    } catch {
      return !1;
    }
  }), xe.handle("events:query", async (a, e) => ge.queryEvents(e)), xe.handle("events:get-by-device", async (a, e, t = 100) => ge.getEventsByDeviceId(e, t)), xe.handle("events:get-by-alert", async (a, e) => ge.getEventsByAlertId(e)), xe.handle("alerts:query", async (a, e) => ge.queryAlerts(e)), xe.handle("alerts:get-by-id", async (a, e) => ge.getAlertById(e)), xe.handle("alerts:mark-reviewed", async (a, e, t) => {
    try {
      return ge.markAlertAsReviewed(e, t), !0;
    } catch {
      return !1;
    }
  }), xe.handle("alerts:delete", async (a, e) => {
    try {
      return ge.deleteAlert(e), !0;
    } catch {
      return !1;
    }
  }), xe.handle("service:status", async () => {
    try {
      const a = new ft({
        name: "HIDDetectionService",
        script: ye.join(__dirname, "service.js")
      });
      return new Promise((e) => {
        a.on("status", (t) => {
          e({
            installed: t !== "Not Found",
            running: t === "Running",
            autoStart: t === "Running",
            logPath: ""
          });
        }), a.status;
      });
    } catch {
      return {
        installed: !1,
        running: !1,
        autoStart: !1,
        logPath: ""
      };
    }
  }), xe.handle("service:install", async () => {
    try {
      return new ft({
        name: "HIDDetectionService",
        script: ye.join(__dirname, "service.js")
      }).install(), !0;
    } catch {
      return !1;
    }
  }), xe.handle("service:uninstall", async () => {
    try {
      return new ft({
        name: "HIDDetectionService"
      }).uninstall(), !0;
    } catch {
      return !1;
    }
  }), xe.handle("service:start", async () => {
    try {
      return new ft({
        name: "HIDDetectionService"
      }).start(), !0;
    } catch {
      return !1;
    }
  }), xe.handle("service:stop", async () => {
    try {
      return new ft({
        name: "HIDDetectionService"
      }).stop(), !0;
    } catch {
      return !1;
    }
  }), xe.handle("playback:start", async (a, e) => {
    var t;
    try {
      return (t = Ee.mainWindow) == null || t.webContents.send("playback:started"), !0;
    } catch {
      return !1;
    }
  }), xe.handle("playback:stop", async () => {
    var a;
    try {
      return (a = Ee.mainWindow) == null || a.webContents.send("playback:stopped"), !0;
    } catch {
      return !1;
    }
  }), xe.handle(
    "virustotal:scan-file",
    async (a, e) => {
      try {
        const t = ge.getSettings();
        if (!t.virustotal.apiKey)
          return null;
        const i = await Xe.readFile(e), n = new FormData();
        n.append("file", new Blob([i]), ye.basename(e));
        const r = (await Ae.post("https://www.virustotal.com/api/v3/files", n, {
          headers: {
            "x-apikey": t.virustotal.apiKey,
            "Content-Type": "multipart/form-data"
          }
        })).data.data.id, c = {
          scanId: r,
          permalink: `https://www.virustotal.com/gui/file/${r}`,
          positives: 0,
          total: 0,
          detectionRate: 0,
          scans: {},
          scanDate: /* @__PURE__ */ new Date()
        };
        return ge.addVTScan(c), c;
      } catch {
        return null;
      }
    }
  ), xe.handle(
    "virustotal:get-scan",
    async (a, e) => ge.getVTScanByScanId(e)
  ), xe.handle("virustotal:get-scans", async () => ge.getAllVTScan()), xe.handle("signatures:get-all", async () => ge.getAllSignatures()), xe.handle("signatures:get-by-id", async (a, e) => ge.getSignatureById(e)), xe.handle(
    "signatures:create",
    async (a, e) => ge.addSignature(e)
  ), xe.handle(
    "signatures:update",
    async (a, e, t) => {
      try {
        return ge.updateSignature(e, t), !0;
      } catch {
        return !1;
      }
    }
  ), xe.handle("signatures:delete", async (a, e) => {
    try {
      return ge.deleteSignature(e), !0;
    } catch {
      return !1;
    }
  }), xe.handle(
    "signatures:load-from-file",
    async (a, e) => {
      try {
        const t = await Ee.signatureEngine.loadFromFile(e), i = Ee.signatureEngine.getSignatures();
        for (const n of i)
          ge.getSignatureBySignatureId(n.signatureId) || ge.addSignature(n);
        return { success: !0, count: t };
      } catch {
        return { success: !1, count: 0 };
      }
    }
  ), xe.handle("settings:get", async () => ge.getSettings()), xe.handle("settings:update", async (a, e) => {
    try {
      return ge.updateSettings(e), e.detection && Ee.analyzer.updateConfig({
        minTypingSpeedThreshold: e.detection.minTypingSpeedThreshold,
        shortcutDensityThreshold: e.detection.shortcutDensityThreshold,
        shortcutTimeWindowMs: e.detection.shortcutTimeWindowMs,
        minInputIntervalVariance: e.detection.minInputIntervalVariance,
        mouseEdgeDetection: e.detection.mouseEdgeDetection
      }), !0;
    } catch {
      return !1;
    }
  }), xe.handle("app:get-version", async () => process.env.npm_package_version || "1.0.0");
}
const zd = dc(import.meta.url), _a = ye.dirname(zd);
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
let De = null, $t = null;
const Ys = process.env.NODE_ENV === "development", Ws = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
function Gs() {
  if (De = new Vs({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: "HID Attack Framework",
    icon: ye.join(process.cwd(), "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !1,
      preload: ye.join(_a, "preload", "index.js"),
      webSecurity: !0,
      allowRunningInsecureContent: !1,
      experimentalFeatures: !1,
      devTools: Ys
    },
    frame: !0,
    titleBarStyle: "default",
    backgroundColor: "#0f172a",
    show: !1
  }), De.on("ready-to-show", () => {
    De == null || De.show();
  }), De.webContents.setWindowOpenHandler(({ url: a }) => (Ea.openExternal(a), { action: "deny" })), De.webContents.on("will-navigate", (a, e) => {
    new URL(e).origin !== new URL(Ws).origin && !e.startsWith("file://") && (a.preventDefault(), Ea.openExternal(e));
  }), Ys)
    De.loadURL(Ws), De.webContents.openDevTools({ mode: "right" });
  else {
    const a = ye.join(process.cwd(), "dist");
    De.loadFile(ye.join(a, "index.html"));
  }
  return De.on("closed", () => {
    De = null;
  }), De;
}
function Yd() {
  try {
    ge.init(), console.log("Database initialized successfully");
  } catch (a) {
    console.error("Failed to initialize database:", a);
  }
}
async function Wd() {
  try {
    $t = new bo();
    const a = ye.join(_a, "..", "main", "signatures", "default-signatures.yaml");
    try {
      const t = await $t.loadFromFile(a);
      console.log(`Loaded ${t} default signatures`);
    } catch {
      console.log("No default signatures file found");
    }
    const e = ge.getAllSignatures();
    for (const t of e)
      $t.addSignature(t);
    console.log(`Total signatures loaded: ${$t.getSignatureCount()}`);
  } catch (a) {
    console.error("Failed to initialize signature engine:", a);
  }
}
function Gd() {
  pc.registerFileProtocol("app", (a, e) => {
    const t = a.url.replace("app://", ""), i = ye.join(_a, "..", "..", t);
    e({ path: i });
  });
}
function Vd() {
  Le.on("web-contents-created", (a, e) => {
    e.on("will-attach-webview", (t) => {
      t.preventDefault();
    });
  });
}
const Jd = Le.requestSingleInstanceLock();
Jd ? (Le.on("second-instance", () => {
  De && (De.isMinimized() && De.restore(), De.focus());
}), Le.whenReady().then(async () => {
  Gd(), Vd(), Yd(), await Wd(), Kd();
  const a = Gs();
  zs(a), Le.on("activate", () => {
    if (Vs.getAllWindows().length === 0) {
      const e = Gs();
      zs(e);
    }
  });
})) : Le.quit();
Le.on("window-all-closed", () => {
  process.platform !== "darwin" && Le.quit();
});
Le.on("before-quit", () => {
  try {
    ge.close(), console.log("Database closed");
  } catch (a) {
    console.error("Error closing database:", a);
  }
});
Le.on("quit", () => {
  console.log("Application quit");
});
Le.on("certificate-error", (a, e, t, i, n, s) => {
  a.preventDefault(), s(!1);
});
Le.on("select-client-certificate", (a, e, t, i) => {
  a.preventDefault(), i();
});
process.on("uncaughtException", (a) => {
  console.error("Uncaught Exception:", a);
});
process.on("unhandledRejection", (a) => {
  console.error("Unhandled Rejection:", a);
});
export {
  nf as default,
  De as mainWindow,
  $t as signatureEngine
};
