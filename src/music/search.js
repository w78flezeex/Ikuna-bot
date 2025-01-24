const { SlashCommandBuilder, ActionRowBuilder, SelectMenuBuilder } = require('discord.js');
const ytsr = require('@distube/ytsr'); // Импортируем @distube/ytsr

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Поиск песни')
    .addStringOption(option =>
      option.setName('запрос')
        .setDescription('Название песни')
        .setRequired(true)
    ),

  async execute(interaction, distube) {
    const query = interaction.options.getString('запрос');
    const voiceChannel = interaction.member.voice.channel;
    const botVoiceChannel = interaction.guild.members.me.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: `${interaction.user}, Сначала вы должены присоединиться к голосовому каналу!`, ephemeral: true });
    }

    if (botVoiceChannel && botVoiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: `${interaction.user}, я уже проигрываю песню в другом голосовом канале, присоединяйся к нам! <#${botVoiceChannel.id}>`,
        ephemeral: true
      });
    }

    // Проверяем, есть ли у бота разрешения на присоединение и воспроизведение в голосовом канале
    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('0x0000000000100000') || !permissions.has('0x0000000000200000')) {
      return interaction.reply({
        content: `${interaction.user}, у меня нет прав, чтобы подключиться к твоему голосовому каналу.`,
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      // Используем ytsr для поиска песен на YouTube по запросу
      const searchResults = await ytsr(query, { limit: 5, safeSearch: false });

      if (!searchResults.items.length) {
        return interaction.editReply({ content: 'Песен по данному запросу не найдено.', ephemeral: true });
      }

      // Создаем меню выбора с результатами поиска
      const options = searchResults.items.map((song, index) => ({
        label: `${index + 1}. ${song.name}`,
        description: song.author.name,
        value: song.url,
      }));

      const row = new ActionRowBuilder()
        .addComponents(
          new SelectMenuBuilder()
            .setCustomId('select_song')
            .setPlaceholder('Выберите песню')
            .addOptions(options)
        );

      await interaction.editReply({ content: 'Выберите песню из списка:', components: [row] });

      const filter = i => i.customId === 'select_song' && i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({ filter, time: 30000 });

      collector.on('collect', async i => {
        const selectedSongUrl = i.values[0];

        try {
          // Воспроизводим выбранную песню
          await distube.play(voiceChannel, selectedSongUrl, {
            textChannel: interaction.channel,
            member: interaction.member,
          });
          await i.deferUpdate();
          await interaction.editReply({ content: `✅ Добавляю в очередь песню: \`${selectedSongUrl}\``, components: [] });
        } catch (error) {
          console.error('Ошибка при добавлении песни:', error);
          await i.deferUpdate();
          await interaction.editReply({ content: 'Произошла ошибка при добавлении песни.', components: [], ephemeral: true });
        }
      });

      collector.on('end', collected => {
        if (collected.size === 0) {
          interaction.editReply({ content: 'Вы не выбрали песню. Сделайте запрос ещё раз.', components: [] });
        }
      });
    } catch (error) {
      console.error('Произошла ошибка при поиске песен:', error);
      await interaction.editReply({ content: 'Произошла ошибка при поиске песен.', ephemeral: true });
    }
  },
};
