const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gdelete')
    .setDescription('Поставить розыгрыш на паузу')
    .addStringOption(option =>
      option.setName('messageid')
        .setDescription('ID сообщения розыгрыша')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('messageid');

    try {
      await interaction.client.giveawaysManager.delete(messageId);
      await interaction.reply({ content: 'Успешно! Розыгрыш удалён.', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Произошла ошибка: \`${err.message}\``, ephemeral: true });
    }
  }
};
