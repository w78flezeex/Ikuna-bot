const { SlashCommandBuilder } = require('@discordjs/builders');
const ytsr = require('@distube/ytsr'); // Подключаем @distube/ytsr

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Включить музыку')
    .addStringOption(option =>
      option.setName('песня')
        .setDescription('Введите название или ссылку на песню')
        .setRequired(true)
        .setAutocomplete(false)  // Включаем автодополнение
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const searchResults = await searchSongs(focusedValue); // Используем ytsr для поиска песен

    const choices = searchResults.slice(0, 5).map(song => ({
      name: song.name,
      value: song.url,
    }));

    await interaction.respond(choices);
  },

  async execute(interaction, distube) {
    const songQuery = interaction.options.getString('песня');
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, Сначала вы должны присоединиться к голосовому каналу!`, ephemeral: true });
    }

    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }

    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('0x0000000000100000') || !permissions.has('0x0000000000200000')) {
      return interaction.reply({
        content: `${interaction.user}, у меня нет прав, чтобы подключиться к твоему голосовому каналу.`,
        ephemeral: true
      });
    }

    await interaction.deferReply(); // Ожидание до 15 минут

    try {
      // Если пользователь ввел текст, а не ссылку, выполняем поиск песни
      let song = songQuery;
      if (!song.startsWith('http')) {
        const searchResults = await searchSongs(songQuery);
        if (searchResults.length > 0) {
          song = searchResults[0].url; // Берем первую найденную песню
        } else {
          return interaction.editReply({ content: 'Не удалось найти песню по вашему запросу.', ephemeral: true });
        }
      }

      // Воспроизведение песни по ссылке
      await distube.play(voiceChannel, song, {
        textChannel: interaction.channel,
        member: interaction.member,
        search: false,
      });

      await interaction.editReply(`✅ Я нашла вашу песню \`${song}\``);
    } catch (error) {
      console.error('Произошла ошибка:', error);
      await interaction.editReply({ content: '❌ Произошла ошибка.', ephemeral: true });
    }
  },
};

// Функция для поиска песен на основе ввода пользователя с использованием ytsr
async function searchSongs(query) {
  try {
    const result = await ytsr(query, { limit: 5, safeSearch: false });
    return result.items.map(video => ({
      name: video.name,
      url: video.url,
    }));
  } catch (error) {
    console.error('Произошла ошибка при поиске песни:', error);
    return [];
  }
}
