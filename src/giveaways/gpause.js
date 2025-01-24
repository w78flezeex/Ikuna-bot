const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gpause')
    .setDescription('Поставить розыгрыш на паузу')
    .addStringOption(option =>
      option.setName('messageid')
        .setDescription('ID сообщения розыгрыша')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('messageid');

    try {
      await interaction.client.giveawaysManager.pause(messageId);
      await interaction.reply({ content: 'Успешно! Розыгрыш поставлен на паузу.', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Произошла ошибка: \`${err.message}\``, ephemeral: true });
    }
  }
};
