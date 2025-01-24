const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Зацыкливание песни')
    .addStringOption(option =>
      option.setName('режим')
        .setDescription('Выберите режим зацыкливания')
        .setRequired(true)
        .addChoices(
          { name: 'Очередь', value: 'queue' },
          { name: 'Текущая песня', value: 'song' },
          { name: 'Выключить', value: 'off' }
        )
    ),

  async execute(interaction, distube) {
    const mode = interaction.options.getString('режим');
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
      return interaction.reply({ content: `${interaction.user}, Сначала вы должны присоединиться к голосовому каналу!`, ephemeral: true });
    }

    if (!queue) {
      return interaction.reply({ content: 'Сейчас музыка не играет.', ephemeral: true });
    }

    let loopMode;
    switch (mode) {
      case 'queue':
        loopMode = 2; // Loop the entire queue
        break;
      case 'song':
        loopMode = 1; // Loop the current song
        break;
      case 'off':
        loopMode = 0; // Turn off loop
        break;
      default:
        loopMode = 0; // Fallback to turning off loop
    }

    queue.setRepeatMode(loopMode);

    const modeText = loopMode === 2 ? '🔀 Очередь' : loopMode === 1 ? '⏸ Текущая песня' : '⏸ Выключено';
    return interaction.reply({ content: `Режим зацикливания установлен: **${modeText}**.` });
  },
};
