# 🏓 Pong Evolution

Um remake moderno, caótico e responsivo do clássico Arcade, desenvolvido do zero com JavaScript Vanilla e a API do Canvas.

Eu criei esse projeto para colocar em prática conceitos de lógica de programação, física 2D (colisões e velocidade) e manipulação do DOM, além de aplicar uma interface moderna usando Glassmorphism. O jogo deixou de ser apenas "rebater a bolinha": agora ele conta com inteligência artificial, habilidades especiais e modos de jogo que mudam as regras da arena.

## Modos de Jogo

Além do modo clássico (PvP ou contra a Máquina em 3 dificuldades), adicionei:
**Orbes de Caos:** Esferas surgem no meio da tela. Acertá-las concede *Buffs* (como resetar cooldowns ou super velocidade) ou *Debuffs* (encolher a raquete do oponente).
**Zona de Colapso:** Um gás tóxico começa a fechar o eixo Y da arena progressivamente, encurtando o tempo de reação e deixando os rebotes mortais.

## Habilidades Especiais
**Dash (E / Seta Esq):** Teleporta a raquete instantaneamente para a linha da bola. Tem um cooldown longo, use para salvar pontos perdidos.
**Congelar (Q / Seta Dir):** Congela a bola no ar por 1.5s, quebrando totalmente o tempo de reação do adversário.

## Tecnologias Utilizadas

* **HTML5 & CSS3:** Estrutura semântica, design responsivo (jogável no celular com controles touch) e CSS Variables para troca de temas em tempo real (Dark, Light, Retro).
* **JavaScript (ES6+):** Motor do jogo rodando a 60fps usando `requestAnimationFrame`, cálculo de vetores e IA preditiva.
* **Web Audio API:** Todos os efeitos sonoros do jogo foram sintetizados nativamente com osciladores (sine, square, sawtooth), sem depender de arquivos `.mp3` externos.

## Como jogar

O projeto roda direto no navegador, não precisa instalar nada.
Acesse o jogo online aqui: https://theusbertelli.github.io/pong-evolution/
