const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gend')
    .setDescription('Завершить розыгрыш')
    .addStringOption(option => 
      option
        .setName('messageid')
        .setDescription('ID сообщения розыгрыша')
        .setRequired(true)
    ),

  async execute(interaction) {
    const client = interaction.client; // Получаем client из interaction
    const messageID = interaction.options.getString('messageid');

    try {
      await client.giveawaysManager.end(messageID);
      await interaction.reply({ content: 'Розыгрыш успешно завершен.', ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: `Не удалось завершить розыгрыш с указанным ID.\n\`${err}\``, ephemeral: true });
    }
  }
};
