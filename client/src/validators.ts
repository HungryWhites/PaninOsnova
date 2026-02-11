export const required = (value: string) => (value ? undefined : 'Поле обязательно')

export const isValidLogin = (value: string) => {
  if (!/^[a-z0-9]{6,20}$/.test(value)) {
    return "Логин должен содержать латинские буквы и цифры и быть длиной от 6 до 20";
  }
  return undefined;
};

export const composeValidators = (...validators: any[]) => (value: string) =>
  validators.reduce((error, validator) => error || validator(value), undefined)
