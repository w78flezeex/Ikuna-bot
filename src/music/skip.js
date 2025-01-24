const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Пропустить текущую песню'),
  async execute(interaction) {
    const distube = interaction.client.distube; // Access distube from interaction.client
    const queue = distube.getQueue(interaction.guildId);
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;

    // Check if the bot is already in another voice channel
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }

    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, сначала вы должны присоединиться к голосовому каналу!`, ephemeral: true });
    }

    if (!queue || !queue.songs.length) {
      return interaction.reply({ content: 'Сейчас музыка не играет!', ephemeral: true });
    }

    try {
      distube.skip(interaction.guildId); // Skip the current song
      if (queue.songs.length === 1) {
        await interaction.reply('⏩ Пропускаю песню, но в очереди больше нет треков!');
      } else {
        await interaction.reply('⏩ Пропускаю песню!');
      }
    } catch (error) {
      console.error('Error skipping song:', error);
      await interaction.reply({ content: 'Произошла ошибка!', ephemeral: true });
    }
  },
};
