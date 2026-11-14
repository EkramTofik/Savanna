/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const q = globalThis, X = q.ShadowRoot && (q.ShadyCSS === void 0 || q.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Q = Symbol(), it = /* @__PURE__ */ new WeakMap();
let $t = class {
  constructor(t, e, s) {
    if (this._$cssResult$ = !0, s !== Q) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t, this.t = e;
  }
  get styleSheet() {
    let t = this.o;
    const e = this.t;
    if (X && t === void 0) {
      const s = e !== void 0 && e.length === 1;
      s && (t = it.get(e)), t === void 0 && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), s && it.set(e, t));
    }
    return t;
  }
  toString() {
    return this.cssText;
  }
};
const wt = (i) => new $t(typeof i == "string" ? i : i + "", void 0, Q), mt = (i, ...t) => {
  const e = i.length === 1 ? i[0] : t.reduce((s, r, n) => s + ((o) => {
    if (o._$cssResult$ === !0) return o.cssText;
    if (typeof o == "number") return o;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + o + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(r) + i[n + 1], i[0]);
  return new $t(e, i, Q);
}, Et = (i, t) => {
  if (X) i.adoptedStyleSheets = t.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of t) {
    const s = document.createElement("style"), r = q.litNonce;
    r !== void 0 && s.setAttribute("nonce", r), s.textContent = e.cssText, i.appendChild(s);
  }
}, st = X ? (i) => i : (i) => i instanceof CSSStyleSheet ? ((t) => {
  let e = "";
  for (const s of t.cssRules) e += s.cssText;
  return wt(e);
})(i) : i;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: St, defineProperty: Ct, getOwnPropertyDescriptor: jt, getOwnPropertyNames: xt, getOwnPropertySymbols: Pt, getPrototypeOf: Tt } = Object, A = globalThis, rt = A.trustedTypes, Ut = rt ? rt.emptyScript : "", F = A.reactiveElementPolyfillSupport, L = (i, t) => i, z = { toAttribute(i, t) {
  switch (t) {
    case Boolean:
      i = i ? Ut : null;
      break;
    case Object:
    case Array:
      i = i == null ? i : JSON.stringify(i);
  }
  return i;
}, fromAttribute(i, t) {
  let e = i;
  switch (t) {
    case Boolean:
      e = i !== null;
      break;
    case Number:
      e = i === null ? null : Number(i);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(i);
      } catch {
        e = null;
      }
  }
  return e;
} }, tt = (i, t) => !St(i, t), nt = { attribute: !0, type: String, converter: z, reflect: !1, useDefault: !1, hasChanged: tt };
Symbol.metadata ?? (Symbol.metadata = Symbol("metadata")), A.litPropertyMetadata ?? (A.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
let x = class extends HTMLElement {
  static addInitializer(t) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t, e = nt) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(t, e), !e.noAccessor) {
      const s = Symbol(), r = this.getPropertyDescriptor(t, s, e);
      r !== void 0 && Ct(this.prototype, t, r);
    }
  }
  static getPropertyDescriptor(t, e, s) {
    const { get: r, set: n } = jt(this.prototype, t) ?? { get() {
      return this[e];
    }, set(o) {
      this[e] = o;
    } };
    return { get: r, set(o) {
      const l = r == null ? void 0 : r.call(this);
      n == null || n.call(this, o), this.requestUpdate(t, l, s);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(t) {
    return this.elementProperties.get(t) ?? nt;
  }
  static _$Ei() {
    if (this.hasOwnProperty(L("elementProperties"))) return;
    const t = Tt(this);
    t.finalize(), t.l !== void 0 && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(L("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(L("properties"))) {
      const e = this.properties, s = [...xt(e), ...Pt(e)];
      for (const r of s) this.createProperty(r, e[r]);
    }
    const t = this[Symbol.metadata];
    if (t !== null) {
      const e = litPropertyMetadata.get(t);
      if (e !== void 0) for (const [s, r] of e) this.elementProperties.set(s, r);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, s] of this.elementProperties) {
      const r = this._$Eu(e, s);
      r !== void 0 && this._$Eh.set(r, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(t) {
    const e = [];
    if (Array.isArray(t)) {
      const s = new Set(t.flat(1 / 0).reverse());
      for (const r of s) e.unshift(st(r));
    } else t !== void 0 && e.push(st(t));
    return e;
  }
  static _$Eu(t, e) {
    const s = e.attribute;
    return s === !1 ? void 0 : typeof s == "string" ? s : typeof t == "string" ? t.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    var t;
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), (t = this.constructor.l) == null || t.forEach((e) => e(this));
  }
  addController(t) {
    var e;
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t), this.renderRoot !== void 0 && this.isConnected && ((e = t.hostConnected) == null || e.call(t));
  }
  removeController(t) {
    var e;
    (e = this._$EO) == null || e.delete(t);
  }
  _$E_() {
    const t = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const s of e.keys()) this.hasOwnProperty(s) && (t.set(s, this[s]), delete this[s]);
    t.size > 0 && (this._$Ep = t);
  }
  createRenderRoot() {
    const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Et(t, this.constructor.elementStyles), t;
  }
  connectedCallback() {
    var t;
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(!0), (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostConnected) == null ? void 0 : s.call(e);
    });
  }
  enableUpdating(t) {
  }
  disconnectedCallback() {
    var t;
    (t = this._$EO) == null || t.forEach((e) => {
      var s;
      return (s = e.hostDisconnected) == null ? void 0 : s.call(e);
    });
  }
  attributeChangedCallback(t, e, s) {
    this._$AK(t, s);
  }
  _$ET(t, e) {
    var n;
    const s = this.constructor.elementProperties.get(t), r = this.constructor._$Eu(t, s);
    if (r !== void 0 && s.reflect === !0) {
      const o = (((n = s.converter) == null ? void 0 : n.toAttribute) !== void 0 ? s.converter : z).toAttribute(e, s.type);
      this._$Em = t, o == null ? this.removeAttribute(r) : this.setAttribute(r, o), this._$Em = null;
    }
  }
  _$AK(t, e) {
    var n, o;
    const s = this.constructor, r = s._$Eh.get(t);
    if (r !== void 0 && this._$Em !== r) {
      const l = s.getPropertyOptions(r), a = typeof l.converter == "function" ? { fromAttribute: l.converter } : ((n = l.converter) == null ? void 0 : n.fromAttribute) !== void 0 ? l.converter : z;
      this._$Em = r;
      const h = a.fromAttribute(e, l.type);
      this[r] = h ?? ((o = this._$Ej) == null ? void 0 : o.get(r)) ?? h, this._$Em = null;
    }
  }
  requestUpdate(t, e, s, r = !1, n) {
    var o;
    if (t !== void 0) {
      const l = this.constructor;
      if (r === !1 && (n = this[t]), s ?? (s = l.getPropertyOptions(t)), !((s.hasChanged ?? tt)(n, e) || s.useDefault && s.reflect && n === ((o = this._$Ej) == null ? void 0 : o.get(t)) && !this.hasAttribute(l._$Eu(t, s)))) return;
      this.C(t, e, s);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(t, e, { useDefault: s, reflect: r, wrapped: n }, o) {
    s && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t) && (this._$Ej.set(t, o ?? e ?? this[t]), n !== !0 || o !== void 0) || (this._$AL.has(t) || (this.hasUpdated || s || (e = void 0), this._$AL.set(t, e)), r === !0 && this._$Em !== t && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const t = this.scheduleUpdate();
    return t != null && await t, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    var s;
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [n, o] of this._$Ep) this[n] = o;
        this._$Ep = void 0;
      }
      const r = this.constructor.elementProperties;
      if (r.size > 0) for (const [n, o] of r) {
        const { wrapped: l } = o, a = this[n];
        l !== !0 || this._$AL.has(n) || a === void 0 || this.C(n, void 0, o, a);
      }
    }
    let t = !1;
    const e = this._$AL;
    try {
      t = this.shouldUpdate(e), t ? (this.willUpdate(e), (s = this._$EO) == null || s.forEach((r) => {
        var n;
        return (n = r.hostUpdate) == null ? void 0 : n.call(r);
      }), this.update(e)) : this._$EM();
    } catch (r) {
      throw t = !1, this._$EM(), r;
    }
    t && this._$AE(e);
  }
  willUpdate(t) {
  }
  _$AE(t) {
    var e;
    (e = this._$EO) == null || e.forEach((s) => {
      var r;
      return (r = s.hostUpdated) == null ? void 0 : r.call(s);
    }), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t) {
    return !0;
  }
  update(t) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((e) => this._$ET(e, this[e]))), this._$EM();
  }
  updated(t) {
  }
  firstUpdated(t) {
  }
};
x.elementStyles = [], x.shadowRootOptions = { mode: "open" }, x[L("elementProperties")] = /* @__PURE__ */ new Map(), x[L("finalized")] = /* @__PURE__ */ new Map(), F == null || F({ ReactiveElement: x }), (A.reactiveElementVersions ?? (A.reactiveElementVersions = [])).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const k = globalThis, ot = (i) => i, B = k.trustedTypes, at = B ? B.createPolicy("lit-html", { createHTML: (i) => i }) : void 0, yt = "$lit$", _ = `lit$${Math.random().toFixed(9).slice(2)}$`, gt = "?" + _, Ot = `<${gt}>`, C = document, M = () => C.createComment(""), R = (i) => i === null || typeof i != "object" && typeof i != "function", et = Array.isArray, Lt = (i) => et(i) || typeof (i == null ? void 0 : i[Symbol.iterator]) == "function", G = `[ 	
\f\r]`, O = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, lt = /-->/g, ht = />/g, w = RegExp(`>|${G}(?:([^\\s"'>=/]+)(${G}*=${G}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), dt = /'/g, ct = /"/g, vt = /^(?:script|style|textarea|title)$/i, kt = (i) => (t, ...e) => ({ _$litType$: i, strings: t, values: e }), y = kt(1), T = Symbol.for("lit-noChange"), c = Symbol.for("lit-nothing"), pt = /* @__PURE__ */ new WeakMap(), E = C.createTreeWalker(C, 129);
function bt(i, t) {
  if (!et(i) || !i.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return at !== void 0 ? at.createHTML(t) : t;
}
const Nt = (i, t) => {
  const e = i.length - 1, s = [];
  let r, n = t === 2 ? "<svg>" : t === 3 ? "<math>" : "", o = O;
  for (let l = 0; l < e; l++) {
    const a = i[l];
    let h, p, d = -1, m = 0;
    for (; m < a.length && (o.lastIndex = m, p = o.exec(a), p !== null); ) m = o.lastIndex, o === O ? p[1] === "!--" ? o = lt : p[1] !== void 0 ? o = ht : p[2] !== void 0 ? (vt.test(p[2]) && (r = RegExp("</" + p[2], "g")), o = w) : p[3] !== void 0 && (o = w) : o === w ? p[0] === ">" ? (o = r ?? O, d = -1) : p[1] === void 0 ? d = -2 : (d = o.lastIndex - p[2].length, h = p[1], o = p[3] === void 0 ? w : p[3] === '"' ? ct : dt) : o === ct || o === dt ? o = w : o === lt || o === ht ? o = O : (o = w, r = void 0);
    const b = o === w && i[l + 1].startsWith("/>") ? " " : "";
    n += o === O ? a + Ot : d >= 0 ? (s.push(h), a.slice(0, d) + yt + a.slice(d) + _ + b) : a + _ + (d === -2 ? l : b);
  }
  return [bt(i, n + (i[e] || "<?>") + (t === 2 ? "</svg>" : t === 3 ? "</math>" : "")), s];
};
class H {
  constructor({ strings: t, _$litType$: e }, s) {
    let r;
    this.parts = [];
    let n = 0, o = 0;
    const l = t.length - 1, a = this.parts, [h, p] = Nt(t, e);
    if (this.el = H.createElement(h, s), E.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (r = E.nextNode()) !== null && a.length < l; ) {
      if (r.nodeType === 1) {
        if (r.hasAttributes()) for (const d of r.getAttributeNames()) if (d.endsWith(yt)) {
          const m = p[o++], b = r.getAttribute(d).split(_), D = /([.?@])?(.*)/.exec(m);
          a.push({ type: 1, index: n, name: D[2], strings: b, ctor: D[1] === "." ? Rt : D[1] === "?" ? Ht : D[1] === "@" ? It : W }), r.removeAttribute(d);
        } else d.startsWith(_) && (a.push({ type: 6, index: n }), r.removeAttribute(d));
        if (vt.test(r.tagName)) {
          const d = r.textContent.split(_), m = d.length - 1;
          if (m > 0) {
            r.textContent = B ? B.emptyScript : "";
            for (let b = 0; b < m; b++) r.append(d[b], M()), E.nextNode(), a.push({ type: 2, index: ++n });
            r.append(d[m], M());
          }
        }
      } else if (r.nodeType === 8) if (r.data === gt) a.push({ type: 2, index: n });
      else {
        let d = -1;
        for (; (d = r.data.indexOf(_, d + 1)) !== -1; ) a.push({ type: 7, index: n }), d += _.length - 1;
      }
      n++;
    }
  }
  static createElement(t, e) {
    const s = C.createElement("template");
    return s.innerHTML = t, s;
  }
}
function U(i, t, e = i, s) {
  var o, l;
  if (t === T) return t;
  let r = s !== void 0 ? (o = e._$Co) == null ? void 0 : o[s] : e._$Cl;
  const n = R(t) ? void 0 : t._$litDirective$;
  return (r == null ? void 0 : r.constructor) !== n && ((l = r == null ? void 0 : r._$AO) == null || l.call(r, !1), n === void 0 ? r = void 0 : (r = new n(i), r._$AT(i, e, s)), s !== void 0 ? (e._$Co ?? (e._$Co = []))[s] = r : e._$Cl = r), r !== void 0 && (t = U(i, r._$AS(i, t.values), r, s)), t;
}
class Mt {
  constructor(t, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t) {
    const { el: { content: e }, parts: s } = this._$AD, r = ((t == null ? void 0 : t.creationScope) ?? C).importNode(e, !0);
    E.currentNode = r;
    let n = E.nextNode(), o = 0, l = 0, a = s[0];
    for (; a !== void 0; ) {
      if (o === a.index) {
        let h;
        a.type === 2 ? h = new I(n, n.nextSibling, this, t) : a.type === 1 ? h = new a.ctor(n, a.name, a.strings, this, t) : a.type === 6 && (h = new Dt(n, this, t)), this._$AV.push(h), a = s[++l];
      }
      o !== (a == null ? void 0 : a.index) && (n = E.nextNode(), o++);
    }
    return E.currentNode = C, r;
  }
  p(t) {
    let e = 0;
    for (const s of this._$AV) s !== void 0 && (s.strings !== void 0 ? (s._$AI(t, s, e), e += s.strings.length - 2) : s._$AI(t[e])), e++;
  }
}
class I {
  get _$AU() {
    var t;
    return ((t = this._$AM) == null ? void 0 : t._$AU) ?? this._$Cv;
  }
  constructor(t, e, s, r) {
    this.type = 2, this._$AH = c, this._$AN = void 0, this._$AA = t, this._$AB = e, this._$AM = s, this.options = r, this._$Cv = (r == null ? void 0 : r.isConnected) ?? !0;
  }
  get parentNode() {
    let t = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && (t == null ? void 0 : t.nodeType) === 11 && (t = e.parentNode), t;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t, e = this) {
    t = U(this, t, e), R(t) ? t === c || t == null || t === "" ? (this._$AH !== c && this._$AR(), this._$AH = c) : t !== this._$AH && t !== T && this._(t) : t._$litType$ !== void 0 ? this.$(t) : t.nodeType !== void 0 ? this.T(t) : Lt(t) ? this.k(t) : this._(t);
  }
  O(t) {
    return this._$AA.parentNode.insertBefore(t, this._$AB);
  }
  T(t) {
    this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
  }
  _(t) {
    this._$AH !== c && R(this._$AH) ? this._$AA.nextSibling.data = t : this.T(C.createTextNode(t)), this._$AH = t;
  }
  $(t) {
    var n;
    const { values: e, _$litType$: s } = t, r = typeof s == "number" ? this._$AC(t) : (s.el === void 0 && (s.el = H.createElement(bt(s.h, s.h[0]), this.options)), s);
    if (((n = this._$AH) == null ? void 0 : n._$AD) === r) this._$AH.p(e);
    else {
      const o = new Mt(r, this), l = o.u(this.options);
      o.p(e), this.T(l), this._$AH = o;
    }
  }
  _$AC(t) {
    let e = pt.get(t.strings);
    return e === void 0 && pt.set(t.strings, e = new H(t)), e;
  }
  k(t) {
    et(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let s, r = 0;
    for (const n of t) r === e.length ? e.push(s = new I(this.O(M()), this.O(M()), this, this.options)) : s = e[r], s._$AI(n), r++;
    r < e.length && (this._$AR(s && s._$AB.nextSibling, r), e.length = r);
  }
  _$AR(t = this._$AA.nextSibling, e) {
    var s;
    for ((s = this._$AP) == null ? void 0 : s.call(this, !1, !0, e); t !== this._$AB; ) {
      const r = ot(t).nextSibling;
      ot(t).remove(), t = r;
    }
  }
  setConnected(t) {
    var e;
    this._$AM === void 0 && (this._$Cv = t, (e = this._$AP) == null || e.call(this, t));
  }
}
class W {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t, e, s, r, n) {
    this.type = 1, this._$AH = c, this._$AN = void 0, this.element = t, this.name = e, this._$AM = r, this.options = n, s.length > 2 || s[0] !== "" || s[1] !== "" ? (this._$AH = Array(s.length - 1).fill(new String()), this.strings = s) : this._$AH = c;
  }
  _$AI(t, e = this, s, r) {
    const n = this.strings;
    let o = !1;
    if (n === void 0) t = U(this, t, e, 0), o = !R(t) || t !== this._$AH && t !== T, o && (this._$AH = t);
    else {
      const l = t;
      let a, h;
      for (t = n[0], a = 0; a < n.length - 1; a++) h = U(this, l[s + a], e, a), h === T && (h = this._$AH[a]), o || (o = !R(h) || h !== this._$AH[a]), h === c ? t = c : t !== c && (t += (h ?? "") + n[a + 1]), this._$AH[a] = h;
    }
    o && !r && this.j(t);
  }
  j(t) {
    t === c ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
  }
}
class Rt extends W {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t) {
    this.element[this.name] = t === c ? void 0 : t;
  }
}
class Ht extends W {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t) {
    this.element.toggleAttribute(this.name, !!t && t !== c);
  }
}
class It extends W {
  constructor(t, e, s, r, n) {
    super(t, e, s, r, n), this.type = 5;
  }
  _$AI(t, e = this) {
    if ((t = U(this, t, e, 0) ?? c) === T) return;
    const s = this._$AH, r = t === c && s !== c || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, n = t !== c && (s === c || r);
    r && this.element.removeEventListener(this.name, this, s), n && this.element.addEventListener(this.name, this, t), this._$AH = t;
  }
  handleEvent(t) {
    var e;
    typeof this._$AH == "function" ? this._$AH.call(((e = this.options) == null ? void 0 : e.host) ?? this.element, t) : this._$AH.handleEvent(t);
  }
}
class Dt {
  constructor(t, e, s) {
    this.element = t, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = s;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t) {
    U(this, t);
  }
}
const J = k.litHtmlPolyfillSupport;
J == null || J(H, I), (k.litHtmlVersions ?? (k.litHtmlVersions = [])).push("3.3.3");
const qt = (i, t, e) => {
  const s = (e == null ? void 0 : e.renderBefore) ?? t;
  let r = s._$litPart$;
  if (r === void 0) {
    const n = (e == null ? void 0 : e.renderBefore) ?? null;
    s._$litPart$ = r = new I(t.insertBefore(M(), n), n, void 0, e ?? {});
  }
  return r._$AI(i), r;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const S = globalThis;
let P = class extends x {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var e;
    const t = super.createRenderRoot();
    return (e = this.renderOptions).renderBefore ?? (e.renderBefore = t.firstChild), t;
  }
  update(t) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = qt(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    var t;
    super.connectedCallback(), (t = this._$Do) == null || t.setConnected(!0);
  }
  disconnectedCallback() {
    var t;
    super.disconnectedCallback(), (t = this._$Do) == null || t.setConnected(!1);
  }
  render() {
    return T;
  }
};
var ft;
P._$litElement$ = !0, P.finalized = !0, (ft = S.litElementHydrateSupport) == null || ft.call(S, { LitElement: P });
const V = S.litElementPolyfillSupport;
V == null || V({ LitElement: P });
(S.litElementVersions ?? (S.litElementVersions = [])).push("4.2.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const _t = (i) => (t, e) => {
  e !== void 0 ? e.addInitializer(() => {
    customElements.define(i, t);
  }) : customElements.define(i, t);
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const zt = { attribute: !0, type: String, converter: z, reflect: !1, hasChanged: tt }, Bt = (i = zt, t, e) => {
  const { kind: s, metadata: r } = e;
  let n = globalThis.litPropertyMetadata.get(r);
  if (n === void 0 && globalThis.litPropertyMetadata.set(r, n = /* @__PURE__ */ new Map()), s === "setter" && ((i = Object.create(i)).wrapped = !0), n.set(e.name, i), s === "accessor") {
    const { name: o } = e;
    return { set(l) {
      const a = t.get.call(this);
      t.set.call(this, l), this.requestUpdate(o, a, i, !0, l);
    }, init(l) {
      return l !== void 0 && this.C(o, void 0, i, l), l;
    } };
  }
  if (s === "setter") {
    const { name: o } = e;
    return function(l) {
      const a = this[o];
      t.call(this, l), this.requestUpdate(o, a, i, !0, l);
    };
  }
  throw Error("Unsupported decorator location: " + s);
};
function $(i) {
  return (t, e) => typeof e == "object" ? Bt(i, t, e) : ((s, r, n) => {
    const o = r.hasOwnProperty(n);
    return r.constructor.createProperty(n, s), o ? Object.getOwnPropertyDescriptor(r, n) : void 0;
  })(i, t, e);
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
function j(i) {
  return $({ ...i, state: !0, attribute: !1 });
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Kt = (i) => i.strings === void 0;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Wt = { CHILD: 2 }, Ft = (i) => (...t) => ({ _$litDirective$: i, values: t });
class Gt {
  constructor(t) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t, e, s) {
    this._$Ct = t, this._$AM = e, this._$Ci = s;
  }
  _$AS(t, e) {
    return this.update(t, e);
  }
  update(t, e) {
    return this.render(...e);
  }
}
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const N = (i, t) => {
  var s;
  const e = i._$AN;
  if (e === void 0) return !1;
  for (const r of e) (s = r._$AO) == null || s.call(r, t, !1), N(r, t);
  return !0;
}, K = (i) => {
  let t, e;
  do {
    if ((t = i._$AM) === void 0) break;
    e = t._$AN, e.delete(i), i = t;
  } while ((e == null ? void 0 : e.size) === 0);
}, At = (i) => {
  for (let t; t = i._$AM; i = t) {
    let e = t._$AN;
    if (e === void 0) t._$AN = e = /* @__PURE__ */ new Set();
    else if (e.has(i)) break;
    e.add(i), Zt(t);
  }
};
function Jt(i) {
  this._$AN !== void 0 ? (K(this), this._$AM = i, At(this)) : this._$AM = i;
}
function Vt(i, t = !1, e = 0) {
  const s = this._$AH, r = this._$AN;
  if (r !== void 0 && r.size !== 0) if (t) if (Array.isArray(s)) for (let n = e; n < s.length; n++) N(s[n], !1), K(s[n]);
  else s != null && (N(s, !1), K(s));
  else N(this, i);
}
const Zt = (i) => {
  i.type == Wt.CHILD && (i._$AP ?? (i._$AP = Vt), i._$AQ ?? (i._$AQ = Jt));
};
class Yt extends Gt {
  constructor() {
    super(...arguments), this._$AN = void 0;
  }
  _$AT(t, e, s) {
    super._$AT(t, e, s), At(this), this.isConnected = t._$AU;
  }
  _$AO(t, e = !0) {
    var s, r;
    t !== this.isConnected && (this.isConnected = t, t ? (s = this.reconnected) == null || s.call(this) : (r = this.disconnected) == null || r.call(this)), e && (N(this, t), K(this));
  }
  setValue(t) {
    if (Kt(this._$Ct)) this._$Ct._$AI(t, this);
    else {
      const e = [...this._$Ct._$AH];
      e[this._$Ci] = t, this._$Ct._$AI(e, this, 0);
    }
  }
  disconnected() {
  }
  reconnected() {
  }
}
/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Xt = () => new Qt();
class Qt {
}
const Z = /* @__PURE__ */ new WeakMap(), te = Ft(class extends Yt {
  render(i) {
    return c;
  }
  update(i, [t]) {
    var s;
    const e = t !== this.G;
    return e && this.rt(void 0), (e || this.lt !== this.ct) && (this.G = t, this.ht = (s = i.options) == null ? void 0 : s.host, this.rt(this.ct = i.element)), c;
  }
  rt(i) {
    if (this.G !== void 0) if (this.isConnected || (i = void 0), typeof this.G == "function") {
      const t = this.ht ?? globalThis;
      let e = Z.get(t);
      e === void 0 && (e = /* @__PURE__ */ new WeakMap(), Z.set(t, e)), e.get(this.G) !== void 0 && this.G.call(this.ht, void 0), e.set(this.G, i), i !== void 0 && this.G.call(this.ht, i);
    } else this.G.value = i;
  }
  get lt() {
    var i, t;
    return typeof this.G == "function" ? (i = Z.get(this.ht ?? globalThis)) == null ? void 0 : i.get(this.G) : (t = this.G) == null ? void 0 : t.value;
  }
  disconnected() {
    this.lt === this.ct && this.rt(void 0);
  }
  reconnected() {
    this.rt(this.ct);
  }
}), ee = {
  "job.loading": "ስራው እየተጫነ ነው",
  "job.error": "ይህን ስራ መጫን አልተቻለም።",
  "job.retry": "እንደገና ሞክር",
  "job.employer": "አሰሪ",
  "job.location": "ቦታ",
  "job.pay": "ክፍያ",
  "job.deadline": "የመጨረሻ ቀን",
  "job.remote": "ከርቀት ተስማሚ",
  "job.requirements": "ዋና መስፈርቶች",
  "job.apply": "ለዚህ ስራ ያመልክቱ",
  "job.playAudio": "የድምጽ ማጠቃለያ አጫውት",
  "job.stopAudio": "የድምጽ ማጠቃለያ አቁም",
  "job.transcript": "የድምጽ ማጠቃለያ ጽሑፍ",
  "job.audioPlaying": "የድምጽ ማጠቃለያ እየተጫወተ ነው",
  "job.audioStopped": "የድምጽ ማጠቃለያ ቆሟል"
}, ie = {
  "job.loading": "Loading job",
  "job.error": "We could not load this job.",
  "job.retry": "Try again",
  "job.employer": "Employer",
  "job.location": "Location",
  "job.pay": "Pay",
  "job.deadline": "Apply by",
  "job.remote": "Remote-friendly",
  "job.requirements": "Key requirements",
  "job.apply": "Apply for this job",
  "job.playAudio": "Play audio summary",
  "job.stopAudio": "Stop audio summary",
  "job.transcript": "Audio summary transcript",
  "job.audioPlaying": "Playing audio summary",
  "job.audioStopped": "Audio summary stopped"
}, Y = "savanna.prefs.v1";
function se() {
  try {
    const i = localStorage.getItem(Y);
    return i ? JSON.parse(i).jobs ?? {} : {};
  } catch {
    return {};
  }
}
function ut(i) {
  try {
    const t = localStorage.getItem(Y), e = t ? JSON.parse(t) : {}, s = { ...e.jobs ?? {}, ...i };
    localStorage.setItem(Y, JSON.stringify({ ...e, jobs: s }));
  } catch {
  }
}
function re(i, t) {
  return (t || i.lang || document.documentElement.lang || "am").slice(0, 2) === "am" ? "am" : "en";
}
var ne = Object.defineProperty, oe = Object.getOwnPropertyDescriptor, g = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? oe(t, e) : t, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(t, e, r) : o(r)) || r);
  return s && r && ne(t, e, r), r;
};
let u = class extends P {
  constructor() {
    super(...arguments), this.job = "", this.api = "", this.apiKey = "", this.lang = "", this.data = null, this.error = !1, this.playing = !1, this.live = "", this.audioRef = Xt(), this.hasLoaded = !1, this.onLang = (i) => {
      var e;
      const t = (e = i.detail) == null ? void 0 : e.lang;
      t && (this.lang = t);
    }, this.onEnded = () => {
      this.playing = !1, this.live = this.t("job.audioStopped");
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("savanna:lang-change", this.onLang), this.hasLoaded && this.load();
  }
  disconnectedCallback() {
    var i, t;
    window.removeEventListener("savanna:lang-change", this.onLang), (i = this.request) == null || i.abort(), (t = this.audioRef.value) == null || t.pause(), super.disconnectedCallback();
  }
  updated(i) {
    (!this.hasLoaded || i.has("job") || i.has("api") || i.has("apiKey")) && (this.hasLoaded = !0, this.load());
  }
  t(i) {
    return (this.activeLang() === "am" ? ee : ie)[i];
  }
  activeLang() {
    return re(this, this.lang);
  }
  apiRoot() {
    return (this.api || "").replace(/\/$/, "");
  }
  async load() {
    var t;
    (t = this.request) == null || t.abort();
    const i = new AbortController();
    if (this.request = i, this.error = !1, this.data = null, !!this.job)
      try {
        const e = `${this.apiRoot()}/v1/jobs/${encodeURIComponent(this.job)}`, s = await fetch(e, {
          headers: { "X-Savanna-Key": this.apiKey },
          signal: i.signal
        });
        if (!s.ok) throw new Error(`HTTP ${s.status}`);
        this.data = await s.json(), ut({ lastJobId: this.job }), this.injectJsonLd(), this.dispatchEvent(
          new CustomEvent("savanna:ready", {
            bubbles: !0,
            composed: !0,
            detail: { job: this.job }
          })
        );
      } catch (e) {
        if (i.signal.aborted) return;
        this.error = !0, this.dispatchEvent(
          new CustomEvent("savanna:error", {
            bubbles: !0,
            composed: !0,
            detail: {
              job: this.job,
              message: e instanceof Error ? e.message : "Unable to load job"
            }
          })
        );
      }
  }
  injectJsonLd() {
    const i = this.querySelector('script[data-savanna="jobposting"]');
    if (i == null || i.remove(), !this.data) return;
    const t = document.createElement("script");
    t.type = "application/ld+json", t.dataset.savanna = "jobposting";
    const e = this.data;
    t.textContent = JSON.stringify({
      "@context": "https://schema.org/",
      "@type": "JobPosting",
      identifier: e.id,
      title: e.title,
      description: e.description[this.activeLang()],
      validThrough: e.validThrough,
      employmentType: "FULL_TIME",
      hiringOrganization: { "@type": "Organization", name: e.employer },
      jobLocationType: e.remote ? "TELECOMMUTE" : "ON_SITE",
      jobLocation: { "@type": "Place", name: e.location }
    }), this.appendChild(t);
  }
  audio() {
    var r, n;
    const i = this.activeLang(), t = (r = this.data) == null ? void 0 : r.audioSummary[i], e = this.apiRoot();
    return { url: (n = t == null ? void 0 : t.url) != null && n.startsWith("http") ? t.url : `${e}${(t == null ? void 0 : t.url) ?? ""}`, transcript: (t == null ? void 0 : t.transcript) ?? "" };
  }
  toggleAudio() {
    const i = this.audioRef.value;
    if (i) {
      if (this.playing) {
        i.pause(), i.currentTime = 0, this.playing = !1, this.live = this.t("job.audioStopped");
        return;
      }
      i.play(), this.playing = !0, this.live = this.t("job.audioPlaying");
    }
  }
  applyHref() {
    if (!this.data) return "#";
    const i = this.data.applyUrl;
    return i.startsWith("http") ? i : `${this.apiRoot()}${i.startsWith("/") ? "" : "/"}${i}`;
  }
  formatDate(i) {
    if (!i) return "—";
    const t = this.activeLang() === "am" ? "am-ET-u-ca-ethiopic" : "en-GB";
    return new Intl.DateTimeFormat(t, {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(i));
  }
  render() {
    var n;
    if (this.error)
      return y`<div class="wrap">
        <p>${this.t("job.error")}</p>
        <button type="button" @click=${() => this.load()}>${this.t("job.retry")}</button>
      </div>`;
    if (!this.data)
      return y`<p>${this.t("job.loading")}</p>`;
    const i = this.activeLang(), t = this.data.description[i], e = ((n = this.data.description.requirements) == null ? void 0 : n[i]) ?? [], s = this.audio(), r = se();
    return y`
      <div class="wrap">
        <article lang=${i}>
          <h2>${this.data.title}</h2>
          <p>${t}</p>
          <dl>
            <dt>${this.t("job.employer")}</dt>
            <dd>${this.data.employer}</dd>
            <dt>${this.t("job.location")}</dt>
            <dd>
              ${this.data.location}${this.data.remote ? ` (${this.t("job.remote")})` : c}
            </dd>
            ${this.data.payText ? y`<dt>${this.t("job.pay")}</dt>
                    <dd>${this.data.payText}</dd>` : c}
            <dt>${this.t("job.deadline")}</dt>
            <dd>${this.formatDate(this.data.validThrough)}</dd>
          </dl>
          ${e.length ? y`<h3>${this.t("job.requirements")}</h3>
                  <ul>
                    ${e.map((o) => y`<li>${o}</li>`)}
                  </ul>` : c}
          <div class="row">
            <button
              type="button"
              @click=${() => this.toggleAudio()}
              aria-pressed=${this.playing ? "true" : "false"}
            >
              ${this.playing ? this.t("job.stopAudio") : this.t("job.playAudio")}
            </button>
            <a class="action" href=${this.applyHref()}>${this.t("job.apply")}</a>
          </div>
          <audio
            ${te(this.audioRef)}
            src=${s.url}
            preload="none"
            @ended=${this.onEnded}
          ></audio>
          <details
            ?open=${r.transcriptOpen !== !1}
            @toggle=${(o) => ut({ transcriptOpen: o.target.open })}
          >
            <summary>${this.t("job.transcript")}</summary>
            <p class="transcript">${s.transcript}</p>
          </details>
        </article>
        <div role="status" aria-live="polite">${this.live}</div>
      </div>
    `;
  }
};
u.styles = mt`
    :host {
      display: block;
      color: #111;
      font-family: var(--savanna-font, "Noto Sans Ethiopic", Nyala, "Segoe UI", system-ui, sans-serif);
      --_accent: var(--savanna-accent, #0b5cab);
      --_radius: var(--savanna-radius, 0.5rem);
      --_focus: var(--savanna-focus, #0b5cab);
      max-width: 100%;
    }
    article {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border: 2px solid #222;
      border-radius: var(--_radius);
      background: #fff;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    dl {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.35rem;
      margin: 0;
    }
    dt {
      font-weight: 700;
    }
    dd {
      margin: 0 0 0.5rem;
      overflow-wrap: anywhere;
    }
    ul {
      margin: 0;
      padding-inline-start: 1.2rem;
    }
    button,
    a.action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 44px;
      padding: 0.5rem 1rem;
      margin: 0 0.5rem 0.5rem 0;
      font: inherit;
      color: #fff;
      background: var(--_accent);
      border: 0;
      border-radius: var(--_radius);
      text-decoration: none;
      cursor: pointer;
    }
    button[aria-pressed="true"] {
      background: #111;
    }
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--_focus);
      outline-offset: 3px;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
    }
    audio {
      display: none;
    }
    summary {
      min-height: 44px;
      display: flex;
      align-items: center;
      cursor: pointer;
    }
    .transcript {
      margin: 0;
      padding: 0.75rem;
      background: #f4f4f4;
      border-left: 4px solid var(--_accent);
      overflow-wrap: anywhere;
    }
    [role="status"] {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    .wrap {
      position: relative;
    }
    @media (forced-colors: active) {
      article {
        border: 2px solid ButtonText;
      }
      button,
      a.action {
        border: 2px solid ButtonText;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      * {
        transition: none !important;
      }
    }
  `;
g([
  $({ type: String })
], u.prototype, "job", 2);
g([
  $({ type: String })
], u.prototype, "api", 2);
g([
  $({ attribute: "api-key" })
], u.prototype, "apiKey", 2);
g([
  $({ type: String })
], u.prototype, "lang", 2);
g([
  j()
], u.prototype, "data", 2);
g([
  j()
], u.prototype, "error", 2);
g([
  j()
], u.prototype, "playing", 2);
g([
  j()
], u.prototype, "live", 2);
u = g([
  _t("savanna-job-card")
], u);
const ae = {
  "cred.loading": "የምስክር ወረቀቱ እየተጫነ ነው",
  "cred.error": "ይህን የምስክር ወረቀት መጫን አልተቻለም።",
  "cred.retry": "እንደገና ሞክር",
  "cred.heading": "የምስክር ወረቀት",
  "cred.status": "ሁኔታ",
  "cred.valid": "ትክክል",
  "cred.revoked": "ተሰርዟል",
  "cred.expired": "ጊዜው አልፏል",
  "cred.issued": "የተሰጠበት ቀን",
  "cred.copy": "የማረጋገጫ አገናኝ ቅዳ",
  "cred.copied": "አገናኙ ተቀድቷል",
  "cred.linkedin": "ወደ ሊንክድኢን ጨምር",
  "cred.pdf": "ምስክር ወረቀቱን አውርድ",
  "cred.verify": "የሕዝብ ማረጋገጫ ገጽ ክፈት"
}, le = {
  "cred.loading": "Loading credential",
  "cred.error": "We could not load this certificate.",
  "cred.retry": "Try again",
  "cred.heading": "Certificate",
  "cred.status": "Status",
  "cred.valid": "Valid",
  "cred.revoked": "Revoked",
  "cred.expired": "Expired",
  "cred.issued": "Issued",
  "cred.copy": "Copy verification link",
  "cred.copied": "Link copied",
  "cred.linkedin": "Add to LinkedIn",
  "cred.pdf": "Download PDF certificate",
  "cred.verify": "Open public verify page"
};
function he(i, t) {
  return (t || i.lang || document.documentElement.lang || "en").slice(0, 2) === "am" ? "am" : "en";
}
var de = Object.defineProperty, ce = Object.getOwnPropertyDescriptor, v = (i, t, e, s) => {
  for (var r = s > 1 ? void 0 : s ? ce(t, e) : t, n = i.length - 1, o; n >= 0; n--)
    (o = i[n]) && (r = (s ? o(t, e, r) : o(r)) || r);
  return s && r && de(t, e, r), r;
};
let f = class extends P {
  constructor() {
    super(...arguments), this.api = "", this.apiKey = "", this.lang = "", this.credentialAttribute = "", this.credential = "", this.data = null, this.error = !1, this.live = "", this.hasLoaded = !1, this.onLang = (i) => {
      var e;
      const t = (e = i.detail) == null ? void 0 : e.lang;
      t && (this.lang = t);
    };
  }
  connectedCallback() {
    super.connectedCallback(), window.addEventListener("savanna:lang-change", this.onLang), this.hasLoaded && this.load();
  }
  disconnectedCallback() {
    var i;
    window.removeEventListener("savanna:lang-change", this.onLang), (i = this.request) == null || i.abort(), super.disconnectedCallback();
  }
  updated(i) {
    (!this.hasLoaded || i.has("credentialAttribute") || i.has("credential") || i.has("api") || i.has("apiKey")) && (this.hasLoaded = !0, this.load());
  }
  t(i) {
    return (this.activeLang() === "am" ? ae : le)[i];
  }
  activeLang() {
    return he(this, this.lang);
  }
  apiRoot() {
    return (this.api || "").replace(/\/$/, "");
  }
  credentialId() {
    return this.credentialAttribute || this.credential || this.id;
  }
  verifyUrl() {
    return `${this.apiRoot()}/verify/${encodeURIComponent(this.credentialId())}`;
  }
  async load() {
    var e;
    (e = this.request) == null || e.abort();
    const i = new AbortController();
    this.request = i, this.error = !1, this.data = null;
    const t = this.credentialId();
    if (t)
      try {
        const s = await fetch(`${this.apiRoot()}/v1/credentials/${encodeURIComponent(t)}`, {
          headers: {
            "X-Savanna-Key": this.apiKey,
            Accept: "application/ld+json"
          },
          signal: i.signal
        });
        if (!s.ok) throw new Error(`HTTP ${s.status}`);
        this.data = await s.json(), this.dispatchEvent(
          new CustomEvent("savanna:ready", {
            bubbles: !0,
            composed: !0,
            detail: { credential: t }
          })
        );
      } catch (s) {
        if (i.signal.aborted) return;
        this.error = !0, this.dispatchEvent(
          new CustomEvent("savanna:error", {
            bubbles: !0,
            composed: !0,
            detail: {
              credential: t,
              message: s instanceof Error ? s.message : "Unable to load credential"
            }
          })
        );
      }
  }
  statusKey() {
    var t, e;
    const i = ((e = (t = this.data) == null ? void 0 : t.credentialStatus) == null ? void 0 : e.status) ?? "valid";
    return i === "revoked" ? "cred.revoked" : i === "expired" ? "cred.expired" : "cred.valid";
  }
  async copy() {
    try {
      await navigator.clipboard.writeText(this.verifyUrl()), this.live = this.t("cred.copied");
    } catch {
      this.live = this.verifyUrl();
    }
  }
  linkedInHref() {
    var r, n, o, l, a, h;
    const i = ((o = (n = (r = this.data) == null ? void 0 : r.credentialSubject) == null ? void 0 : n.achievement) == null ? void 0 : o.name) ?? ((l = this.data) == null ? void 0 : l.name) ?? "Savanna credential", t = (a = this.data) != null && a.validFrom ? new Date(this.data.validFrom).getFullYear() : (/* @__PURE__ */ new Date()).getFullYear(), e = (h = this.data) != null && h.validFrom ? new Date(this.data.validFrom).getMonth() + 1 : 1;
    return `https://www.linkedin.com/profile/add?${new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: i,
      organizationName: "የሳቫና ተደራሽነት ኪት",
      issueYear: String(t),
      issueMonth: String(e),
      certUrl: this.verifyUrl()
    }).toString()}`;
  }
  render() {
    var s, r;
    if (this.error)
      return y`<p>${this.t("cred.error")}</p>
        <button type="button" @click=${() => this.load()}>${this.t("cred.retry")}</button>`;
    if (!this.data) return y`<p>${this.t("cred.loading")}</p>`;
    const i = this.activeLang(), t = ((r = (s = this.data.credentialSubject) == null ? void 0 : s.achievement) == null ? void 0 : r.name) ?? this.data.name ?? "Credential", e = this.data.validFrom ? new Intl.DateTimeFormat(i === "am" ? "am-ET-u-ca-ethiopic" : "en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }).format(new Date(this.data.validFrom)) : "";
    return y`
      <article lang=${i}>
        <h2>${this.t("cred.heading")}፦ ${t}</h2>
        <p>${this.t("cred.status")}: ${this.t(this.statusKey())}</p>
        <p>${this.t("cred.issued")}: ${e}</p>
        <div class="row">
          <button type="button" @click=${() => this.copy()}>${this.t("cred.copy")}</button>
          <a class="action" href=${this.linkedInHref()} rel="noopener noreferrer" target="_blank"
            >${this.t("cred.linkedin")}</a
          >
          <a class="action" href=${this.verifyUrl()}>${this.t("cred.verify")}</a>
          <a
            class="action"
            href=${`${this.apiRoot()}/verify/${encodeURIComponent(this.credentialId())}/pdf`}
            >${this.t("cred.pdf")}</a
          >
        </div>
        <p role="status" aria-live="polite">${this.live}</p>
      </article>
    `;
  }
};
f.styles = mt`
    :host {
      display: block;
      font-family: var(--savanna-font, "Noto Sans Ethiopic", Nyala, "Segoe UI", system-ui, sans-serif);
      --_accent: var(--savanna-accent, #0b5cab);
      --_radius: var(--savanna-radius, 0.5rem);
      --_focus: var(--savanna-focus, #0b5cab);
      color: #111;
      max-width: 100%;
    }
    article {
      padding: 1rem;
      border: 2px solid #222;
      border-radius: var(--_radius);
      background: #fff;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 1.25rem;
      overflow-wrap: anywhere;
    }
    .row {
      display: flex;
      flex-wrap: wrap;
    }
    button,
    a.action {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      min-width: 44px;
      padding: 0.5rem 1rem;
      margin: 0 0.5rem 0.5rem 0;
      font: inherit;
      color: #fff;
      background: var(--_accent);
      border: 0;
      border-radius: var(--_radius);
      text-decoration: none;
      cursor: pointer;
    }
    button:focus-visible,
    a:focus-visible {
      outline: 3px solid var(--_focus);
      outline-offset: 3px;
    }
    [role="status"] {
      min-height: 1.5rem;
    }
    @media (forced-colors: active) {
      article {
        border: 2px solid ButtonText;
      }
    }
  `;
v([
  $({ type: String })
], f.prototype, "api", 2);
v([
  $({ attribute: "api-key" })
], f.prototype, "apiKey", 2);
v([
  $({ type: String })
], f.prototype, "lang", 2);
v([
  $({ attribute: "id" })
], f.prototype, "credentialAttribute", 2);
v([
  $({ attribute: "credential" })
], f.prototype, "credential", 2);
v([
  j()
], f.prototype, "data", 2);
v([
  j()
], f.prototype, "error", 2);
v([
  j()
], f.prototype, "live", 2);
f = v([
  _t("savanna-credential")
], f);
