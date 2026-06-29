import slugify from 'slugify';

export const generateSlug = (text: string) => {
  return slugify(text, {
    replacement: '-',
    remove: /[*+~.()'"!:@]/g,
    lower: true,
    strict: true,
    locale: 'pt'
  });
};
