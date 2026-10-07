# 靈感轉運站 — 獨立網站部署指南

## 架構

```
linggan-site/
├── index.html              ← 前端主頁（含 AI 功能）
├── netlify.toml            ← Netlify 設定
├── netlify/functions/
│   └── feedback.js         ← 回饋資料庫代理（Supabase）
└── package.json
```

**AI 功能由買家自備 Anthropic API Key，直接從瀏覽器呼叫，你不需要付任何 API 費用。**

---

## 步驟一：上傳到 GitHub

1. 去 https://github.com/new 建立新 repo（建議名稱：`linggan-site`）
2. 在本機 terminal 執行：

```bash
git init
git add .
git commit -m "初始版本"
git remote add origin https://github.com/你的帳號/linggan-site.git
git push -u origin main
```

---

## 步驟二：在 Netlify 部署

1. 去 https://app.netlify.com → **Add new site → Import from Git**
2. 選 GitHub，選剛剛建的 repo
3. Build settings 保持空白（純靜態 + Functions）
4. 點 **Deploy site**，幾秒後即上線

---

## 步驟三：設定環境變數

在 Netlify → Site settings → Environment variables 設定：

| 變數名稱 | 說明 | 範例 |
|----------|------|------|
| `ADMIN_PASSWORD` | 管理員密碼（查看回饋用） | `my-secret-pwd` |
| `SUPABASE_URL` | Supabase 專案 URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key | `eyJ...` |

設定後點 **Trigger deploy** 重新部署。

---

## 步驟四：設定 Supabase（回饋資料庫）

1. 去 https://supabase.com → 建立免費專案
2. 在 SQL Editor 執行：

```sql
CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  rate TEXT NOT NULL,
  note TEXT,
  ig TEXT,
  nick TEXT,
  ts TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert" ON feedback
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "service role can read" ON feedback
  FOR SELECT TO service_role USING (true);
```

3. 到 Settings → API，複製：
   - **Project URL** → `SUPABASE_URL`
   - **service_role** (secret) → `SUPABASE_SERVICE_KEY`

---

## 買家使用流程

1. 買家收到網址後，開啟工具
2. 第一次點「✨ 幫我生文字稿」時，會彈出輸入框，要求填入 **Anthropic API Key**
3. 取得方式：https://console.anthropic.com/settings/keys（需自行辦帳號）
4. 輸入後儲存在瀏覽器，往後不需再輸入
5. **費用由買家自行承擔**，你完全不需要付 API 費用

> 如需重置 API Key：按 F12 → Console → 輸入 `localStorage.removeItem('_apiKey')` → 重新整理

---

## 管理後台（查看回饋）

- 在工具底部「靈感救援隊」連按 5 下
- 首次使用會要求輸入管理密碼（即 `ADMIN_PASSWORD`）
- 輸入後儲存在瀏覽器，往後不需再輸入
