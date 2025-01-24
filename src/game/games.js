const { SlashCommandBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json');
const {
  Minesweeper,
  Snake,
} = require('discord-gamecord');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('game')
    .setDescription('Выберите игру для игры')
    .addStringOption((option) =>
      option
        .setName('игра')
        .setDescription('Выберите игру')
        .setRequired(true)
        .addChoices(
          { name: 'Змейка', value: 'snake' },
          { name: 'Сапёр', value: 'mineswapper' },
        )
    ),

  async execute(interaction) {
    
    if (!interaction.isCommand()) return;

    const gameType = interaction.options.getString('игра');

    switch (gameType) {

      case 'snake':
        new Snake({
          message: interaction,
          isSlashGame: true,
          embed: {
            title: `Игра: Змейка`,
            color: embedcolor,
          },
          timeoutTime: 60000,
          winMessage: `Вы выйграли! Вы собрали {score} очка!`,
          loseMessage: `Вы проиграли! Вы собрали: {score} очка`,
          playerOnlyMessage: `Игрок: {player}, играет в игру "змейка"`,
        }).startGame();
        break;

    case 'mineswapper':
        new Minesweeper({
            message: interaction,
            isSlashGame: true,
            embed: {
                title: `Сапёр`,
                color: '#5865F2',
                description: `Нажимайте на кнопки, чтобы открыть все блоки, кроме мин.`
              },
              emojis: { flag: '🚩', mine: '💣' },
              mines: 5,
            timeoutTime: 60000,
            winMessage: `Поздравляем! Вы выйграли в игре.`,
            loseMessage: `Вы проиграли игру! В следующий раз будьте внимательны к минам.`,
            playerOnlyMessage: `Игрок: {player}, играет в игру "сапёр"`,
          }).startGame();
          break;
      default:
        await interaction.reply({ content: `Произошла ошибка!`, ephemeral: true });
        break;
    }
  },
};
