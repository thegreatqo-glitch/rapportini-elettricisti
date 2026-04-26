# ⚡ Rapportini Elettricisti

Webapp per la compilazione dei rapportini orari di una squadra di elettricisti.

- 👨‍💼 **Admin**: gestisce dipendenti, commesse, vede e modifica tutti i rapportini
- 👷 **Dipendenti**: aprono il proprio link personale e compilano il rapportino dal telefono
- 📊 **Excel**: un file scaricabile per ogni dipendente per ogni mese
- ☁️ **Cloud**: dati sincronizzati su Supabase, app pubblicata su Vercel

---

## 📋 Prima di iniziare

Avrai bisogno di **3 account gratuiti** (5 minuti in tutto):

1. **GitHub** → [github.com/signup](https://github.com/signup) — per ospitare il codice
2. **Supabase** → [supabase.com](https://supabase.com) — il database
3. **Vercel** → [vercel.com/signup](https://vercel.com/signup) — per pubblicare l'app

Suggerimento: per Vercel e Supabase puoi accedere direttamente con il tuo account GitHub.

---

## 🚀 Passo 1 · Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) e clicca **Start your project**
2. Crea una nuova organizzazione se richiesto, poi clicca **New Project**
3. Compila:
   - **Name**: `rapportini` (o quello che vuoi)
   - **Database Password**: una password forte — **annotala**, ti servirà se vorrai accedere al DB direttamente
   - **Region**: scegli la più vicina (es. `Frankfurt` per Italia)
4. Clicca **Create new project** e aspetta circa 2 minuti

### 1.1 · Crea le tabelle del database

1. Nel menu a sinistra clicca **SQL Editor**
2. Clicca **New query**
3. Apri il file `supabase/schema.sql` di questo progetto, **copia tutto il contenuto** e incollalo nell'editor
4. Clicca **Run** (in basso a destra)
5. Dovresti vedere `Success. No rows returned`

### 1.2 · Recupera le chiavi del progetto

1. Nel menu a sinistra clicca **Project Settings** (icona ingranaggio in basso) → **API**
2. Copia e tieni a portata di mano:
   - **Project URL** (es. `https://abcdefghi.supabase.co`)
   - **anon public** key (la chiave lunga che inizia per `eyJ...`)

---

## 🚀 Passo 2 · Carica il codice su GitHub

### Opzione A · Caricamento via web (la più semplice, no terminale)

1. Vai su [github.com](https://github.com) e clicca **+ → New repository**
2. Compila:
   - **Repository name**: `rapportini-elettricisti`
   - Lascia `Public` (o `Private` se preferisci)
   - **Non** selezionare "Add README"
3. Clicca **Create repository**
4. Nella pagina che si apre clicca **uploading an existing file**
5. Trascina nella pagina **tutti i file e cartelle** del progetto (`package.json`, `index.html`, `vite.config.js`, le cartelle `src/` e `supabase/`, ecc.) **eccetto** la cartella `node_modules` se esiste e il file `.env`
6. Scrivi un messaggio tipo `primo upload` e clicca **Commit changes**

### Opzione B · Da terminale (se sai usare git)

```bash
git init
git add .
git commit -m "primo commit"
git branch -M main
git remote add origin https://github.com/TUO_USERNAME/rapportini-elettricisti.git
git push -u origin main
```

---

## 🚀 Passo 3 · Pubblica l'app su Vercel

1. Vai su [vercel.com](https://vercel.com) e accedi (con GitHub è più rapido)
2. Clicca **Add New… → Project**
3. Trovi l'elenco dei tuoi repository GitHub: clicca **Import** accanto a `rapportini-elettricisti`
4. Nella schermata di configurazione:
   - **Framework Preset**: dovrebbe rilevare automaticamente `Vite`. Se no, selezionalo dal menu
   - Apri la sezione **Environment Variables** e aggiungi queste due variabili:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` *(la Project URL del passo 1.2)* |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` *(la anon public key del passo 1.2)* |

5. Clicca **Deploy**
6. Dopo 1-2 minuti vedrai una schermata di conferma con il link pubblico, qualcosa tipo `https://rapportini-elettricisti.vercel.app`

🎉 **L'app è online!**

---

## 🎯 Passo 4 · Primo utilizzo

1. Apri il link Vercel della tua app
2. Accedi con:
   - **Username**: `Admin`
   - **Password**: `Futuro2026!`
3. Vai sulla scheda **Commesse** e aggiungi i tuoi cantieri (es. "Cantiere Via Roma", "Manutenzione Studio Bianchi", ecc.) — *Ferie* e *Malattia* sono già presenti
4. Vai su **Dipendenti** e aggiungi i tuoi tecnici. Per ognuno verrà generato un **link personale** con un pulsante per copiarlo
5. Manda quel link a ogni dipendente (WhatsApp, email, ecc.). Lui lo apre, vede il suo nome, compila il rapportino e premerà *Invia*
6. Tu in **Rapportini** vedi tutto in tempo reale, puoi filtrare per mese/dipendente e scaricare l'Excel

---

## 📊 Come funzionano i file Excel

- Vai su **Rapportini** → seleziona il dipendente e il mese → clicca **Excel del periodo**
- Si scarica un file tipo `Rapportino_Rossi_Mario_2026-04.xlsx`
- Il file contiene **una riga per ogni rapportino** del mese, più totali finali
- Ogni dipendente ha un file separato, ogni mese ha un file separato (esattamente come richiesto)

### Caricarli su Google Drive

I file scaricati possono essere trascinati nella cartella Google Drive che vuoi.
Per il **caricamento automatico su Drive** servirebbe un'integrazione aggiuntiva con Google Apps Script o OAuth (in v2 si può aggiungere — il campo "ID cartella Drive" nelle Impostazioni è già pronto a riceverlo).

---

## 🔧 Personalizzazioni utili

### Cambiare la password admin

Apri il file `src/App.jsx`, cerca le righe in cima:

```javascript
const ADMIN_USER = 'Admin';
const ADMIN_PASS = 'Futuro2026!';
```

Modifica i valori, salva, fai **commit** su GitHub e Vercel ripubblica automaticamente in 30 secondi.

### Cambiare il nome dell'azienda

Accedi come Admin → **Impostazioni** → **Nome azienda** → salva.

---

## 💻 Sviluppo locale (facoltativo)

Se vuoi modificare l'app sul tuo PC prima di pubblicare:

```bash
# Installa Node.js da nodejs.org se non ce l'hai
npm install
cp .env.example .env
# Modifica .env con le tue credenziali Supabase
npm run dev
```

L'app si apre su `http://localhost:5173`.

---

## 🆘 Problemi frequenti

**"Errore di connessione al database"**
→ Le variabili d'ambiente su Vercel sono sbagliate. Vai su Vercel → Settings → Environment Variables e ricontrolla URL e chiave anon. Dopo aver corretto, vai su **Deployments** e clicca **Redeploy** sull'ultimo.

**"Link non valido" quando un dipendente apre il suo link**
→ Probabilmente è stato eliminato o il link è stato copiato male. Rigeneralo dal pannello Dipendenti.

**Voglio cambiare il dominio**
→ Su Vercel → Settings → Domains puoi collegare un dominio personalizzato gratuitamente (es. `rapportini.tuaazienda.it`).

---

## 🔒 Una nota sulla sicurezza

Questa è una soluzione **per uso interno aziendale**. Le politiche di accesso sono permissive: chiunque conosca l'URL pubblico dell'app e i token dei dipendenti può scrivere nel database. Va benissimo per una piccola squadra di fiducia.

Se in futuro avrai bisogno di sicurezza più forte (controllo degli accessi reale, audit log, ecc.) si può migrare verso Supabase Auth con politiche RLS più stringenti — chiedi e ti aiuteremo.

---

## ⚙️ Stack tecnico

- **Frontend**: React 18 + Vite
- **Database**: PostgreSQL su Supabase
- **Hosting**: Vercel
- **Excel**: SheetJS (libreria xlsx)
- **Icone**: Lucide

Costo totale: **0€** entro i limiti dei piani gratuiti (più che sufficienti per una piccola/media azienda).
