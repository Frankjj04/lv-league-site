# Cómo desbloquear el formulario de registro / How to unlock the registration form

---

## 🇲🇽 Español

**El problema:** ahora mismo, cuando alguien entra a la página de registro, Google le pide
**iniciar sesión** en lugar de mostrar el formulario. Los equipos que no tengan cuenta de Google
—o que no sepan qué hacer— se van a salir sin registrarse.

**La causa:** el formulario tiene activada alguna opción que obliga a iniciar sesión.

### Los pasos (5 minutos)

1. Abre el formulario en Google Forms (el mismo donde ves las respuestas).
2. Arriba, haz clic en la pestaña **Configuración** (el engrane ⚙️).
3. Abre la sección **Respuestas** y revisa estas tres cosas:

   | Opción | Cómo debe quedar |
   |---|---|
   | **Recopilar direcciones de correo** | En **No recopilar** *(o "Entrada del encuestado" — pero NO "Verificado")* |
   | **Limitar a 1 respuesta** | **DESACTIVADO** ← esta es la causa más común, obliga a iniciar sesión |
   | **Restringir a usuarios de [organización]** | **DESACTIVADO** *(solo aparece en cuentas de escuela o empresa)* |

4. Guarda y cierra.

### Cómo comprobar que ya quedó

Abre una **ventana de incógnito** (Chrome: `Cmd+Shift+N`) y pega este enlace:

```
https://forms.gle/bxiA7X9htGQmF93U8
```

- ✅ Si ves las preguntas del formulario → ya quedó, la página web ya funciona.
- ❌ Si te pide iniciar sesión → todavía falta apagar alguna de las tres opciones de arriba.

---

## 🇺🇸 English

**The problem:** right now, visitors to the registration page get a Google **sign-in screen**
instead of the form. Teams without a Google account — or who don't know what to do — will leave
without registering.

**The cause:** the form has a setting turned on that forces sign-in.

### Steps (5 minutes)

1. Open the form in Google Forms (the same one where you read the responses).
2. Click the **Settings** tab (⚙️) at the top.
3. Open the **Responses** section and check these three things:

   | Setting | What it should be |
   |---|---|
   | **Collect email addresses** | **Do not collect** *(or "Responder input" — but NOT "Verified")* |
   | **Limit to 1 response** | **OFF** ← most common cause; this one forces sign-in |
   | **Restrict to users in [organization]** | **OFF** *(only appears on school/work accounts)* |

4. Save and close.

### How to verify

Open an **incognito window** (Chrome: `Cmd+Shift+N`) and paste this link:

```
https://forms.gle/bxiA7X9htGQmF93U8
```

- ✅ Form questions appear → done, the website works.
- ❌ Sign-in screen appears → one of the three settings above is still on.

---

## Nothing needs to change on the website

The form is already wired into the home page (`index.html`) — the embed and the "open separately" button both
point at this same form, so responses keep landing in the same spreadsheet. The moment the
settings above are fixed, the page starts working for everyone. No code change, no redeploy.
