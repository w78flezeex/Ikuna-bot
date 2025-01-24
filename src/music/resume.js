const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Возобновить песню'),
  async execute(interaction, distube) {
    const queue = distube.getQueue(interaction.guild.id);
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;

    // Проверка на то, что бот уже находится в другом голосовом канале
    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }
    
    // Проверка, что пользователь находится в голосовом канале
    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, Сначала вы должены присоединиться к голосовому каналу!`, ephemeral: true });
    }

    // Проверка на наличие очереди
    if (!queue) {
      return interaction.reply({ content: 'Сейчас нет музыки на паузе.', ephemeral: true });
    }

    // Проверка, если музыка уже воспроизводится
    if (!queue.paused) {
      return interaction.reply({ content: `${interaction.user}, Музыка уже воспроизводится!`, ephemeral: true });
    }

    queue.resume();
    await interaction.reply('⏹ Музыка возобновлена.');
  },
};
