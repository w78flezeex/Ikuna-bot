const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('creatorinfo')
    .setDescription('Показать создателя бота'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Создатель бота:')
      .setDescription(`👨🏻‍💻ДС: @kirill_voxholl, @prd.yt\n👨🏻‍💻TG: [Клик чтобы написать в телеграмме](https://t.me/Kirill_voxholl)\n👨🏻‍💻Сервер поддержки бота: [Клик чтобы перейти](https://discord.gg/KurkaJwp)`)
      .setFooter({ text: 'Бот находиться на бета-тестирование'})
     .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
