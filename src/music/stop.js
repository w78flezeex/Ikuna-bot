const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Остановить музыку и очистить очередь'),
  async execute(interaction, distube) {
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
      return interaction.reply({ content: `${interaction.user}, Сначала вы должены присоединиться к голосовому каналу!`, ephemeral: true });
    }

    distube.stop(interaction.guild.id);
    await interaction.reply('⏸ Музыка остановлена. Очередь очищена');
  },
};
