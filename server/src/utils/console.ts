export const getErrorString = (res: any) => {
  return JSON.parse((res?.error)?.text || {})?.error
}