const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Удалить песню из очереди.')
    .addIntegerOption(option =>
      option.setName('позиция')
        .setDescription('Номер песни в очереди')
        .setRequired(true)
    ),
  
  async execute(interaction, distube) {
    const position = interaction.options.getInteger('позиция');
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

    if (position > queue.songs.length || position < 1) {
      return interaction.reply({ content: 'Неправильный номер позиции.', ephemeral: true });
    }

    const removedSong = queue.songs.splice(position - 1, 1);
    return interaction.reply(`✅ Удалена песня **${removedSong[0].name}** из очереди.`);
  },
};
