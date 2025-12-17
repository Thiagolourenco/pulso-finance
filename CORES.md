# 🎨 Design System – Esquema de Cores

Este documento define o **esquema oficial de cores** para o aplicativo financeiro (Web), contemplando **Light Mode** e **Dark Mode**, com foco em **clareza, confiança e usabilidade**.

---

## 1️⃣ Princípios

* Cores são **semânticas**, não decorativas
* O mesmo significado **sempre usa a mesma cor**
* Priorizar legibilidade e contraste (AA+)
* Design confortável para uso diário

---

## 2️⃣ Light Mode (Padrão)

### 🔹 Backgrounds

```txt
bg.primary      #F8FAFC
bg.secondary    #FFFFFF
bg.elevated     #FFFFFF
bg.hover        #F1F5F9
```

### 🔹 Texto

```txt
text.primary    #020617
text.secondary  #475569
text.disabled   #94A3B8
text.highlight  #0F172A
```

### 🔹 Bordas e divisores

```txt
border.default  #E5E7EB
border.divider  #CBD5E1
border.focus    #2563EB
```

### 🔹 Cores semânticas

```txt
action.primary  #2563EB
status.success  #16A34A
status.error    #DC2626
status.warning  #F59E0B
status.info     #0EA5E9
```

### 🔹 Estados (background)

```txt
state.success   #DCFCE7
state.error     #FEE2E2
state.warning   #FEF3C7
state.info      #E0F2FE
```

---

## 3️⃣ Dark Mode

### 🔹 Backgrounds

```txt
bg.primary      #020617
bg.secondary    #0F172A
bg.elevated     #020617
bg.hover        #1E293B
```

### 🔹 Texto

```txt
text.primary    #F8FAFC
text.secondary  #CBD5E1
text.disabled   #64748B
text.highlight  #E5E7EB
```

### 🔹 Bordas e divisores

```txt
border.default  #1E293B
border.divider  #334155
border.focus    #60A5FA
```

### 🔹 Cores semânticas

```txt
action.primary  #3B82F6
status.success  #22C55E
status.error    #F87171
status.warning  #FBBF24
status.info     #38BDF8
```

### 🔹 Estados (background)

```txt
state.success   #052E16
state.error     #450A0A
state.warning   #422006
state.info      #082F49
```

---

## 4️⃣ Gráficos

### Regras

* Evitar vermelho e verde juntos
* Preferir tons suaves
* Destaque sempre na cor primária

### Paleta recomendada

```txt
graph.blue      #2563EB
graph.green     #16A34A
graph.yellow    #F59E0B
graph.purple    #7C3AED
graph.gray      #94A3B8
```

---

## 5️⃣ Tokens de Design

### Convenção

```txt
color.bg.*
color.text.*
color.border.*
color.action.*
color.status.*
color.state.*
```

> ❗ Nunca usar cores diretas nos componentes. Sempre usar tokens.

---

## 6️⃣ Regras de Ouro

* Verde = entrada / progresso
* Vermelho = saída / erro
* Amarelo = atenção
* Azul = ação / foco
* Texto nunca depende apenas de cor

---

## 7️⃣ Sensação do Produto

**Light Mode**

* Claro
* Organizado
* Produtivo

**Dark Mode**

* Premium
* Confortável
* Foco prolongado

---

📌 Documento pronto para uso em **Figma, Frontend ou Design System**.
