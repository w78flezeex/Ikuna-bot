const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Изменить громкость песен')
    .addIntegerOption(option => option.setName('громкость').setDescription('Допустимые значения (0-100)').setRequired(true)),
  
  async execute(interaction, distube) {
    const volume = interaction.options.getInteger('громкость');
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
    if (volume < 0 || volume > 100) {
      return interaction.reply({ content: 'Пожалуйста, выберите уровень громкости от 0 до 100.', ephemeral: true });
    }

    const queue = distube.getQueue(interaction.guild.id);
    if (!queue) {
      return interaction.reply({ content: 'Сейчас музыка не играет.', ephemeral: true });
    }

    queue.setVolume(volume);
    return interaction.reply({ content: `🎵 Громкость установлена на ${volume}%` });
  },
};
