import{g as O}from"./contracts-d4055159.js";function U(e,t){for(var r=0;r<t.length;r++){const u=t[r];if(typeof u!="string"&&!Array.isArray(u)){for(const o in u)if(o!=="default"&&!(o in e)){const c=Object.getOwnPropertyDescriptor(u,o);c&&Object.defineProperty(e,o,c.get?c:{enumerable:!0,get:()=>u[o]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}var P={exports:{}},n={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var y=Symbol.for("react.element"),V=Symbol.for("react.portal"),L=Symbol.for("react.fragment"),q=Symbol.for("react.strict_mode"),W=Symbol.for("react.profiler"),M=Symbol.for("react.provider"),z=Symbol.for("react.context"),B=Symbol.for("react.forward_ref"),H=Symbol.for("react.suspense"),Y=Symbol.for("react.memo"),G=Symbol.for("react.lazy"),E=Symbol.iterator;function J(e){return e===null||typeof e!="object"?null:(e=E&&e[E]||e["@@iterator"],typeof e=="function"?e:null)}var w={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},T=Object.assign,C={};function p(e,t,r){this.props=e,this.context=t,this.refs=C,this.updater=r||w}p.prototype.isReactComponent={};p.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};p.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function $(){}$.prototype=p.prototype;function v(e,t,r){this.props=e,this.context=t,this.refs=C,this.updater=r||w}var S=v.prototype=new $;S.constructor=v;T(S,p.prototype);S.isPureReactComponent=!0;var g=Array.isArray,j=Object.prototype.hasOwnProperty,R={current:null},x={key:!0,ref:!0,__self:!0,__source:!0};function I(e,t,r){var u,o={},c=null,f=null;if(t!=null)for(u in t.ref!==void 0&&(f=t.ref),t.key!==void 0&&(c=""+t.key),t)j.call(t,u)&&!x.hasOwnProperty(u)&&(o[u]=t[u]);var s=arguments.length-2;if(s===1)o.children=r;else if(1<s){for(var i=Array(s),l=0;l<s;l++)i[l]=arguments[l+2];o.children=i}if(e&&e.defaultProps)for(u in s=e.defaultProps,s)o[u]===void 0&&(o[u]=s[u]);return{$$typeof:y,type:e,key:c,ref:f,props:o,_owner:R.current}}function K(e,t){return{$$typeof:y,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function b(e){return typeof e=="object"&&e!==null&&e.$$typeof===y}function Q(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(r){return t[r]})}var k=/\/+/g;function _(e,t){return typeof e=="object"&&e!==null&&e.key!=null?Q(""+e.key):t.toString(36)}function h(e,t,r,u,o){var c=typeof e;(c==="undefined"||c==="boolean")&&(e=null);var f=!1;if(e===null)f=!0;else switch(c){case"string":case"number":f=!0;break;case"object":switch(e.$$typeof){case y:case V:f=!0}}if(f)return f=e,o=o(f),e=u===""?"."+_(f,0):u,g(o)?(r="",e!=null&&(r=e.replace(k,"$&/")+"/"),h(o,t,r,"",function(l){return l})):o!=null&&(b(o)&&(o=K(o,r+(!o.key||f&&f.key===o.key?"":(""+o.key).replace(k,"$&/")+"/")+e)),t.push(o)),1;if(f=0,u=u===""?".":u+":",g(e))for(var s=0;s<e.length;s++){c=e[s];var i=u+_(c,s);f+=h(c,t,r,i,o)}else if(i=J(e),typeof i=="function")for(e=i.call(e),s=0;!(c=e.next()).done;)c=c.value,i=u+_(c,s++),f+=h(c,t,r,i,o);else if(c==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return f}function d(e,t,r){if(e==null)return e;var u=[],o=0;return h(e,u,"","",function(c){return t.call(r,c,o++)}),u}function X(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(r){(e._status===0||e._status===-1)&&(e._status=1,e._result=r)},function(r){(e._status===0||e._status===-1)&&(e._status=2,e._result=r)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var a={current:null},m={transition:null},Z={ReactCurrentDispatcher:a,ReactCurrentBatchConfig:m,ReactCurrentOwner:R};n.Children={map:d,forEach:function(e,t,r){d(e,function(){t.apply(this,arguments)},r)},count:function(e){var t=0;return d(e,function(){t++}),t},toArray:function(e){return d(e,function(t){return t})||[]},only:function(e){if(!b(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};n.Component=p;n.Fragment=L;n.Profiler=W;n.PureComponent=v;n.StrictMode=q;n.Suspense=H;n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Z;n.cloneElement=function(e,t,r){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var u=T({},e.props),o=e.key,c=e.ref,f=e._owner;if(t!=null){if(t.ref!==void 0&&(c=t.ref,f=R.current),t.key!==void 0&&(o=""+t.key),e.type&&e.type.defaultProps)var s=e.type.defaultProps;for(i in t)j.call(t,i)&&!x.hasOwnProperty(i)&&(u[i]=t[i]===void 0&&s!==void 0?s[i]:t[i])}var i=arguments.length-2;if(i===1)u.children=r;else if(1<i){s=Array(i);for(var l=0;l<i;l++)s[l]=arguments[l+2];u.children=s}return{$$typeof:y,type:e.type,key:o,ref:c,props:u,_owner:f}};n.createContext=function(e){return e={$$typeof:z,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:M,_context:e},e.Consumer=e};n.createElement=I;n.createFactory=function(e){var t=I.bind(null,e);return t.type=e,t};n.createRef=function(){return{current:null}};n.forwardRef=function(e){return{$$typeof:B,render:e}};n.isValidElement=b;n.lazy=function(e){return{$$typeof:G,_payload:{_status:-1,_result:e},_init:X}};n.memo=function(e,t){return{$$typeof:Y,type:e,compare:t===void 0?null:t}};n.startTransition=function(e){var t=m.transition;m.transition={};try{e()}finally{m.transition=t}};n.unstable_act=function(){throw Error("act(...) is not supported in production builds of React.")};n.useCallback=function(e,t){return a.current.useCallback(e,t)};n.useContext=function(e){return a.current.useContext(e)};n.useDebugValue=function(){};n.useDeferredValue=function(e){return a.current.useDeferredValue(e)};n.useEffect=function(e,t){return a.current.useEffect(e,t)};n.useId=function(){return a.current.useId()};n.useImperativeHandle=function(e,t,r){return a.current.useImperativeHandle(e,t,r)};n.useInsertionEffect=function(e,t){return a.current.useInsertionEffect(e,t)};n.useLayoutEffect=function(e,t){return a.current.useLayoutEffect(e,t)};n.useMemo=function(e,t){return a.current.useMemo(e,t)};n.useReducer=function(e,t,r){return a.current.useReducer(e,t,r)};n.useRef=function(e){return a.current.useRef(e)};n.useState=function(e){return a.current.useState(e)};n.useSyncExternalStore=function(e,t,r){return a.current.useSyncExternalStore(e,t,r)};n.useTransition=function(){return a.current.useTransition()};n.version="18.2.0";P.exports=n;var D=P.exports;const ee=O(D),ie=U({__proto__:null,default:ee},[D]);var F={exports:{}},te="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED",re=te,ne=re;function A(){}function N(){}N.resetWarningCache=A;var oe=function(){function e(u,o,c,f,s,i){if(i!==ne){var l=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw l.name="Invariant Violation",l}}e.isRequired=e;function t(){return e}var r={array:e,bigint:e,bool:e,func:e,number:e,object:e,string:e,symbol:e,any:e,arrayOf:t,element:e,elementType:e,instanceOf:t,node:e,objectOf:t,oneOf:t,oneOfType:t,shape:t,exact:t,checkPropTypes:N,resetWarningCache:A};return r.PropTypes=r,r};F.exports=oe();var ue=F.exports;const se=O(ue);export{se as P,ie as R,ee as a,D as r};