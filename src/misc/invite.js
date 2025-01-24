const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const { embedcolor } = require('../../config.json')

module.exports = {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Добавить бота на свой сервер'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(embedcolor)
      .setTitle('Добавить меня на свой сервер')
    
    embed.setDescription(`[Нажмите чтобы добавить меня на сервер (клик)](https://discord.com/oauth2/authorize?client_id=1290719504237723688&permissions=8&integration_type=0&scope=bot)`)
      .setFooter({ text: 'Бот находиться на бета-тестирование'})
     .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};