const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Перевыбрать победителя')
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
      await client.giveawaysManager.reroll(messageID, {
        messages: {
          congrat: '🎉 Новый(е) победитель(и): {winners}! Поздравляем, вы выиграли **{this.prize}**!',
          error: 'К розыгрышу никто не присоединился!'
        }
      });
      await interaction.reply({ content: 'Победитель успешно перевыбран.', ephemeral: true });
    } catch (err) {
      console.error(err);
      await interaction.reply({ content: `Не удалось перевыбрать победителя для розыгрыша с указанным ID.\n\`${err}\``, ephemeral: true });
    }
  }
};
