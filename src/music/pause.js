const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Поставить песню на паузу'),
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guild.id);

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

    if (!queue) {
      return interaction.reply({ content: 'Сейчас ничего не играет.', ephemeral: true });
    }

    // Check if the queue is already paused
    if (queue.paused) {
      return interaction.reply({ content: `${interaction.user}, Очередь уже на паузе.`, ephemeral: true });
    }

    queue.pause();
    await interaction.reply('⏸ Музыка на паузе.');
  },
};
