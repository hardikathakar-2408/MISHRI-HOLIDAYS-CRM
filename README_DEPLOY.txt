MISHRI HOLIDAYS CRM — NETLIFY PAR DEPLOY + APP INSTALL GUIDE
================================================================

📌 IMPORTANT — TAME PEHLA THI J NETLIFY PAR LIVE CHO?
----------------------------------------------------------------
Jo tamaru site already Netlify par chalu che (jem "mishri-crm"),
to tamare STEP A/B (naya GitHub/Netlify account) FARI KARVANI
JARUR NATHI. Khali:
  1. Tamara EXISTING GitHub repo ma jaao
  2. Aa zip ni andar ni badhi files (index.html, netlify.toml,
     netlify/functions/* — badhu) upload karine PURANI files ne
     OVERWRITE/REPLACE karo (same file names, same jagya)
  3. "Commit changes" dabao
  4. Netlify potei j automatic navu deploy start kari deshe
     (1-2 minute) — koi vadhu step nathi

Aa EK J deploy ma niche na badha fixes/features aavi jashe (koi
alag-alag deploys karvani jarur nathi — credits bachse):
  ✓ Quotation: Option 1/2/3 labels, check-in/out dates, real
    vehicle type, total package cost, meal-plan full names
  ✓ 2-vaar-save-karvu-padtu bug — fixed (itinerary, room category
    sathe)
  ✓ Mattress rate double-charge — hatavyu
  ✓ Option 1 mathi Place/Check-in/Check-out auto-copy
  ✓ Auto houseboat-cruise text — hatavyu (default nathi aavtu have)
  ✓ Voucher: per-hotel Confirmation No./Address/Contact, Check-in/
    out TIME, Vehicle/Cab No., Extra Mattress figure
  ✓ Voucher: duplicate Pick-up/Drop row fix, redundant Hotel Conf.
    hatavyu, Package Amount hatavyu
  ✓ PASSWORD PROTECTION — naavu (niche STEP 2 ma details)

Jo TAMNE HAJU SUDHI SITE NATHI BANAVI (fresh setup), to niche
STEP A thi shuru karo.


⿡ NETLIFY PAR DEPLOY KARVU (10 minute, EK J VAAR — fresh setup mate)
----------------------------------------------------------------
STEP A — GitHub par files upload karo:
  1. https://github.com par jaine free account banavo (jo na hoy to)
  2. "New repository" banavo — naam aapo: mishri-crm
  3. "uploading an existing file" link par click karo
  4. Aa ZIP ni ANDAR ni BADHI files+folders (netlify.toml, package.json,
     index.html, manifest.json, sw.js, ane "netlify" folder — badhu)
     drag-and-drop kari deo
  5. "Commit changes" dabao

STEP B — Netlify sathe connect karo:
  1. https://app.netlify.com par jaine free account banavo
     (GitHub thi j sign-up karo — sauthi sarad)
  2. "Add new site" → "Import an existing project" dabao
  3. GitHub select karo → tamaru "mishri-crm" repo pasand karo
  4. Netlify potei j "netlify.toml" vanchi lese — kai settings
     badalva ni jarur nathi, seedhu "Deploy" dabao
  5. 1-2 minute ma deploy thai jashe — tamne ek link malshe jem ke:
     https://mishri-crm-xyz123.netlify.app

     AA LINK J TAMARI PERMANENT APP CHE — save kari rakho.

(Jo GitHub/Netlify setup ma koi pan step ma atki jav, to screenshot
mokli deo, hu step-by-step guide karish.)


⿢ 🔒 PASSWORD SET KARVU (SECURITY — FARJIYAAT, EK J VAAR)
----------------------------------------------------------------
Deploy thaya pachi app ne PASSWORD-PROTECTED banavo, nahi to link
malta koi pan tamaru guest data (naam, phone, email) joi shakshe.

  1. Netlify dashboard ma tamari site kholo
  2. "Site configuration" → "Environment variables" par jaao
  3. "Add a variable" dabao — BE (2) variables add karo:

       Key   : APP_PASSWORD
       Value : (tame icho e strong password, jem ke Mishri@2026)

       Key   : TOKEN_SECRET
       Value : (ek lambi random string — niche batavel command thi
                banavo)

     TOKEN_SECRET banavva mate, computer par (Command Prompt/
     Terminal ma) aa command chalao ane output copy-paste karo:

       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

  4. Save karo
  5. "Deploys" tab ma jaine "Trigger deploy" → "Deploy site" dabao
     (aa password ne activate karva mate jaruri che)

Have jyare pan app kholso (mobile ke desktop), pehla PASSWORD
mangshe. Sachu password nakhya pachi j data દેખાશે/sync thashe.
Password ek vaar nakhya pachi e j browser/device ma yaad rahese
(fari-fari nakhvani jarur nathi, 30 divas sudhi).

⚠️ AA STEP SKIP NA KARSO — Password set karya vagar app UNPROTECTED
j rahese (data koi pan link malta joi shakshe). Jo bhulo, app locked
nathi thato — khali "safe fallback" tarike open j rahese, evu design
karyu che jethi tame galti thi lock-out na thai jav — pan matlab e
ke tame BADHA (APP_PASSWORD + TOKEN_SECRET banne) set karya vagar
data actually protected nathi thatu.


⿢ MOBILE PAR APP INSTALL KARVI
----------------------------------------------------------------
  1. Mobile Chrome ma upar wali Netlify link kholo
  2. Address bar ni bajuma "Install App" / "Add to Home Screen"
     popup aavshe (agar automatic na aave to Chrome menu ⋮ →
     "Add to Home screen" dabao)
  3. Have app tamara HOME SCREEN par ek ICON tarike aavi jashe —
     browser tab vagar direct khulse, jem koi normal app hoy


⿣ DESKTOP PAR APP INSTALL KARVI
----------------------------------------------------------------
  1. Desktop Chrome/Edge ma e j Netlify link kholo
  2. Address bar ni jamni baju ⊕ "Install" icon par click karo
  3. App Desktop/Start Menu ma icon tarike aavi jashe


⿤ AUTO-SYNC HAVE KEVI RITE KAAM KARE CHE
----------------------------------------------------------------
  - Mobile ane Desktop banne e j Netlify link/app use kare —
    banne no data ek j cloud storage (Netlify Blobs) ma save thay
  - Booking save karo etle turant cloud ma pahochi jay
  - Bijo device khole (mobile/desktop, koi pan WiFi/mobile data par)
    to automatic latest data aavi jay — dar 20 second background
    ma pan auto-check thay che
  - INTERNET JOIE — offline hoy to data mobile/desktop ni potani
    local storage ma j save rahe, pachi internet aave etle auto-sync


⿥ IMPORTANT NOTES
----------------------------------------------------------------
  - Aa setup mate NODE.JS DESKTOP PAR INSTALL KARVANI JARUR NATHI —
    badhu Netlify na server par j chale che
  - Pehla nu "LAN Desktop Server" zip (START_MISHRI_CRM.bat) have
    IGNORE kari shakay — e purani same-WiFi-only padhdhati hati
  - Free Netlify plan ma pan aa app sahej thai jay (functions +
    storage free tier ma j aavi jay che, normal CRM data mate paurtu)
  - Data cloud par (Netlify Blobs) save thay che — koi pan ek
    device no data delete/lost thay to bija device/cloud thi
    pacho aavi jay


QUESTIONS? Deploy karta koi step ma atko to screenshot sathe pucho.


🔒 SECURITY — SU PROTECT THAY CHE (technical summary)
----------------------------------------------------------------
- Password vagar app khulti j nathi — kai pan data (naam, phone,
  email) na dekhay
- API endpoints (booking save/delete/sync) badha j password-token
  vagar 401 Unauthorized aape che — link malva chatta pan direct
  API call thi data chori/edit na thai shake
- Password code ma LAKHELU NATHI (GitHub par pan nahi) — matra
  Netlify na private "Environment variables" ma j rahe che
- Login token 30 divas pachi automatic expire thay — pachi fari
  password mangse
- Netlify Blobs (jya data save thay che) Netlify na infrastructure
  par encrypted rahe che (standard cloud practice)
