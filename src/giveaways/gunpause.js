const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gunpause')
    .setDescription('Поставить розыгрыш на паузу')
    .addStringOption(option =>
      option.setName('messageid')
        .setDescription('ID сообщения розыгрыша')
        .setRequired(true)
    ),

  async execute(interaction) {
    const messageId = interaction.options.getString('messageid');

    try {
      await interaction.client.giveawaysManager.unpause(messageId);
      await interaction.reply({ content: 'Успешно! Розыгрыш продолжен.', ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Произошла ошибка: \`${err.message}\``, ephemeral: true });
    }
  }
};
