const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const translate = require('@iamtraction/google-translate');
const { embedcolor } = require('../../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Перевести текст на выбранный язык')
    .addStringOption(option =>
      option.setName('язык')
        .setDescription('Выберите язык для перевода')
        .setRequired(true)
        .addChoices(
          { name: 'Русский', value: 'ru' },
          { name: 'Английский', value: 'en' },
          { name: 'Турецкий', value: 'tr' },
          { name: 'Испанский', value: 'es' },
          { name: 'Индийский', value: 'hi' },
          { name: 'Китайский', value: 'zh' },
          { name: 'Японский', value: 'ja' }
        )
    )
    .addStringOption(option =>
      option.setName('текст')
        .setDescription('Введите текст, который нужно перевести')
        .setRequired(true)
    ),

  async execute(interaction) {
    const language = interaction.options.getString('язык');
    const text = interaction.options.getString('текст');

    try {
      const translated = await translate(text, { to: language });
      const embed = new EmbedBuilder()
        .setColor(embedcolor)
        .setTitle('Перевод текста')
        .addFields(
          { name: 'Исходный текст', value: text },
          { name: 'Переведённый текст', value: translated.text },
          { name: 'Язык перевода', value: language }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      await interaction.reply('Произошла ошибка при переводе текста. Пожалуйста, попробуйте позже.');
    }
  },
};
