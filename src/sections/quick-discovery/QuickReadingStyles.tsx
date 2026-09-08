// The same markup becomes an ordinary readable document when movement is off
// or JavaScript is unavailable. No alternate copy or duplicate scene tree.
const readingRules = `
[data-qd-root] [data-stage]{height:auto!important;min-height:0!important;padding:80px 28px!important;margin:0!important;max-width:none!important;scroll-margin-top:90px}
[data-qd-root] [data-stage]>div[class*="viewport"]{position:relative;top:auto;height:auto;min-height:0;overflow:visible;display:block}
[data-qd-root] [data-embers],[data-qd-root] [data-stars],[data-qd-root] [data-flash],[data-qd-root] [data-entry-cam],[data-qd-root] [data-who-grid],[data-qd-root] [data-who-atmos],[data-qd-root] [data-who-sparks],[data-qd-root] [data-build-blueprint],[data-qd-root] [data-beyond-big],[data-qd-root] [data-beyond-warm],[data-qd-root] [data-fut-glow],[data-qd-root] [data-plan-spot],[data-qd-root] [data-pap-board],[data-qd-root] [data-mun-spot],[data-qd-root] [data-pap-caret]{display:none!important}
[data-qd-root] [data-label],[data-qd-root] [data-entry-title],[data-qd-root] [data-entry-sub],[data-qd-root] [data-who-name],[data-qd-root] [data-who-field],[data-qd-root] [data-who-role],[data-qd-root] [data-who-line],[data-qd-root] [data-build-head],[data-qd-root] [data-build-caption],[data-qd-root] [data-workcard],[data-qd-root] [data-plan-title],[data-qd-root] [data-pap-title],[data-qd-root] [data-mun-title],[data-qd-root] [data-aura-title],[data-qd-root] [data-plan-line],[data-qd-root] [data-pap-line],[data-qd-root] [data-mun-line],[data-qd-root] [data-aura-line],[data-qd-root] [data-plan-evidence],[data-qd-root] [data-pap-evidence],[data-qd-root] [data-mun-evidence],[data-qd-root] [data-aura-tail],[data-qd-root] [data-beyond-lead],[data-qd-root] [data-bg-layer],[data-qd-root] [data-beyond-strip],[data-qd-root] [data-fut-near],[data-qd-root] [data-fut-plane],[data-qd-root] [data-fut-final],[data-qd-root] [data-contact-mark],[data-qd-root] [data-contact-title],[data-qd-root] [data-contact],[data-qd-root] [data-ch],[data-qd-root] [data-build-w]{position:relative!important;inset:auto!important;transform:none!important;filter:none!important;opacity:1!important;will-change:auto!important;text-shadow:none!important}
[data-qd-root] [data-label]{margin:0 0 24px}
[data-qd-root] h1,[data-qd-root] h2,[data-qd-root] h3{white-space:normal!important;line-height:1.16!important}
[data-qd-root] [data-who-name]{justify-content:flex-start;font-size:clamp(30px,4vw,62px);gap:0 .3em;margin:28px 0}
[data-qd-root] [data-who-field]{display:flex;flex-wrap:wrap;gap:10px 22px;margin:30px 0}
[data-qd-root] [data-who-role]{font-size:clamp(26px,4vw,58px)}
[data-qd-root] [data-who-line],[data-qd-root] [data-fut-near],[data-qd-root] [data-fut-final]{width:auto;max-width:760px;text-align:left}
[data-qd-root] [data-who-line] p{text-align:left}
[data-qd-root] [data-entry-title]{font-size:24px;letter-spacing:.12em;margin:36px 0}
[data-qd-root] [data-entry-sub]{white-space:normal;line-height:1.8}
[data-qd-root] [data-who-hint]{display:none}
[data-qd-root] [data-build-head]{max-width:none;margin:0 0 28px}
[data-qd-root] [data-build-caption]{margin:30px 0;font-size:16px;max-width:700px}
[data-qd-root] [data-frame]{position:relative!important;inset:auto!important;transform:none!important;margin:30px 0;zoom:var(--reading-fit,.3)}
[data-qd-root]:not([data-ready]) [data-frame]{display:none}
[data-qd-root] [data-frame="build"]{display:block!important;width:auto!important;height:auto!important;zoom:1}
[data-qd-root] [data-frame="build"]>svg,[data-qd-root] [data-build-stage]{display:none}
[data-qd-root] [data-build-cap]{position:static!important;opacity:1!important;transform:none!important;max-width:640px;margin:24px 0}
[data-qd-root] [data-build-cap]>div:last-child{font-size:16px!important;line-height:1.8;letter-spacing:0;max-width:none!important;width:auto!important;white-space:normal}
[data-qd-root] [data-build-cap]>div:first-child{font-size:30px!important}
[data-qd-root] [data-plan-line],[data-qd-root] [data-pap-line],[data-qd-root] [data-mun-line],[data-qd-root] [data-aura-line]{width:auto;max-width:780px;text-align:left;font-size:clamp(22px,3vw,30px);margin:24px 0}
[data-qd-root] [class*="papTitleBox"]{position:relative;inset:auto;height:auto}
[data-qd-root] [data-plan-evidence],[data-qd-root] [data-pap-evidence],[data-qd-root] [data-mun-evidence]{width:min(100%,400px);margin:30px 0}
[data-qd-root] [data-frame="aura"]{display:block!important;width:auto!important;height:auto!important;zoom:1}
[data-qd-root] [data-aura-wire],[data-qd-root] [data-aura-spine]{display:none}
[data-qd-root] [data-aura-step]{position:static!important;opacity:1!important;transform:none!important;margin:24px 0}
[data-qd-root] [data-aura-step]>span:last-child{font-size:15px!important}
[data-qd-root] [data-aura-tail]{text-align:left;max-width:90%;margin:40px 0}
[data-qd-root] [data-bg-layer]{display:inline-block;vertical-align:top;width:min(360px,100%)!important;margin:32px 32px 20px 0}
[data-qd-root] [data-beyond-strip]{width:auto;justify-content:flex-start;padding:0;margin:28px 0}
[data-qd-root] [data-fut-horizon]{position:relative;inset:auto;transform:none;max-width:90%;margin:40px 0}
[data-qd-root] [data-fut-plane]{display:inline-block;white-space:normal;margin:16px 24px 16px 0;font-size:24px}
[data-qd-root] [data-fut-final]{margin:36px 0}
[data-qd-root] [data-chip]{transition:none}
[data-qd-root] [data-frame] *{filter:none!important}
[data-qd-root] [class*="schematic"]{position:static;margin:16px 0}
@media(min-width:1100px){[data-qd-root] [data-stage]{padding-right:240px!important;padding-left:72px!important}}
`;

export function QuickReadingStyles() {
  return <>
    <style data-reading-style media="(prefers-reduced-motion: reduce), (scripting: none), (max-height: 650px), (max-width: 360px), (max-width: 760px) and (max-height: 740px)">{readingRules}</style>
    <noscript><style>{readingRules}</style></noscript>
  </>;
}
