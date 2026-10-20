const formularioRegisto = document.getElementById("form-registo");
const campoEmail = document.getElementById("email");
const campoSenha = document.getElementById("senha");
const estadoAcesso = document.getElementById("estado-acesso");
const botaoEntrar = document.getElementById("botao-entrar");
const botaoSair = document.getElementById("botao-sair");

const formulario = document.getElementById("form-tarefa");
const campoTarefa = document.getElementById("titulo-tarefa");
const listaTarefas = document.getElementById("lista-tarefas");
const mensagem = document.getElementById("mensagem");

const formularioNovaSenha =
  document.getElementById("form-nova-senha");

const campoNovaSenha =
  document.getElementById("nova-senha");


const botaoRecuperar = document.getElementById("botao-recuperar");
const URL_APLICACAO = "https://progaminy.github.io/Supbtarefas/";

// Recuperar a palavra-passe
botaoRecuperar.addEventListener("click", async function () {
  const email = campoEmail.value.trim();

  if (!email) {
    estadoAcesso.textContent = "Escreve primeiro o teu e-mail.";
    campoEmail.focus();
    return;
  }

  estadoAcesso.textContent = "A enviar o e-mail de recuperação...";

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: URL_APLICACAO
  });

  if (error) {
    estadoAcesso.textContent =
      "Erro ao enviar o e-mail: " + error.message;
    return;
  }

  estadoAcesso.textContent =
    "Se o e-mail estiver registado, receberás instruções para recuperar a palavra-passe. Verifica também o Spam.";
});

// Criar uma conta
formularioRegisto.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  estadoAcesso.textContent = "A criar a conta...";

  const { data, error } = await supabaseClient.auth.signUp({
  email,
  password: senha,
  options: {
    emailRedirectTo: "https://progaminy.github.io/Supbtarefas/"
   }
  });

  if (error) {
    estadoAcesso.textContent = "Erro: " + error.message;
    return;
  }

  if (data.session) {
    estadoAcesso.textContent = "Conta criada e sessão iniciada!";
    await carregarTarefas();
  } else {
    estadoAcesso.textContent =
      "Conta criada! Verifica o teu e-mail para confirmar a conta.";
  }
});

// Iniciar sessão
botaoEntrar.addEventListener("click", async function () {
  const email = campoEmail.value.trim();
  const senha = campoSenha.value;

  if (!email || !senha) {
    estadoAcesso.textContent = "Preenche o e-mail e a palavra-passe.";
    return;
  }

  estadoAcesso.textContent = "A iniciar sessão...";

  const { error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    estadoAcesso.textContent = "Erro: " + error.message;
    return;
  }

  estadoAcesso.textContent = "Sessão iniciada com sucesso!";
  await carregarTarefas();
});

// Terminar sessão
botaoSair.addEventListener("click", async function () {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    estadoAcesso.textContent = "Erro: " + error.message;
    return;
  }

  listaTarefas.replaceChildren();
  estadoAcesso.textContent = "Sessão terminada.";
});

// Carregar tarefas do utilizador autenticado
async function carregarTarefas() {
  const { data: { user }, error: erroUtilizador } =
    await supabaseClient.auth.getUser();

  if (erroUtilizador || !user) {
    mensagem.textContent = "Inicia sessão para veres as tuas tarefas.";
    return;
  }

  const { data, error } = await supabaseClient
    .from("Tarefas")
    .select("id, titulo, concluida")
    .order("id", { ascending: false });

  if (error) {
    mensagem.textContent = "Erro ao carregar tarefas: " + error.message;
    return;
  }

  listaTarefas.replaceChildren();

  data.forEach(function (tarefa) {
    mostrarTarefa(tarefa);
  });

  mensagem.textContent = data.length
    ? "As tuas tarefas foram carregadas."
    : "Ainda não tens tarefas guardadas.";
}

// Mostrar uma tarefa na página
function mostrarTarefa(tarefa) {
  const item = document.createElement("li");
  const texto = document.createElement("span");

  texto.textContent = tarefa.titulo;
  item.appendChild(texto);

  listaTarefas.appendChild(item);
}

// Adicionar e guardar uma tarefa
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const titulo = campoTarefa.value.trim();

  if (!titulo) {
    mensagem.textContent = "Escreve uma tarefa primeiro.";
    return;
  }

  const { data: { user }, error: erroUtilizador } =
    await supabaseClient.auth.getUser();

  if (erroUtilizador || !user) {
    mensagem.textContent = "Inicia sessão antes de adicionar tarefas.";
    return;
  }

  mensagem.textContent = "A guardar a tarefa...";

  const { data, error } = await supabaseClient
    .from("Tarefas")
    .insert({
      titulo: titulo,
      concluida: false,
      user_id: user.id
    })
    .select("id, titulo, concluida")
    .single();

  if (error) {
    mensagem.textContent = "Erro ao guardar: " + error.message;
    return;
  }

  mostrarTarefa(data);
  campoTarefa.value = "";
  mensagem.textContent = "Tarefa guardada no Supabase!";
});

// Verificar se já existe uma sessão
async function verificarSessao() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error) {
    estadoAcesso.textContent = "Erro ao verificar sessão.";
    return;
  }

  if (data.session) {
    estadoAcesso.textContent = "Já tens sessão iniciada.";
    await carregarTarefas();
  } else {
    mensagem.textContent = "Inicia sessão para guardares tarefas.";
  }
}

verificarSessao();

// Mostrar o formulário quando o utilizador abre
// um link válido de recuperação
supabaseClient.auth.onAuthStateChange(
  function (evento, sessao) {
    if (evento === "PASSWORD_RECOVERY" && sessao) {
      formularioNovaSenha.hidden = false;
      estadoAcesso.textContent =
        "Link válido! Define a tua nova palavra-passe.";
    }
  }
);

// Guardar a nova palavra-passe
formularioNovaSenha.addEventListener(
  "submit",
  async function (evento) {
    evento.preventDefault();

    const novaSenha = campoNovaSenha.value;

    if (novaSenha.length < 6) {
      estadoAcesso.textContent =
        "A palavra-passe deve ter pelo menos 6 caracteres.";
      return;
    }

    estadoAcesso.textContent =
      "A guardar a nova palavra-passe...";

    const { error } = await supabaseClient.auth.updateUser({
      password: novaSenha
    });

    if (error) {
      estadoAcesso.textContent =
        "Erro: " + error.message;
      return;
    }

    estadoAcesso.textContent =
      "Palavra-passe alterada! Já podes iniciar sessão com a nova palavra-passe.";

    formularioNovaSenha.reset();
    formularioNovaSenha.hidden = true;

    await supabaseClient.auth.signOut();
  }
);


