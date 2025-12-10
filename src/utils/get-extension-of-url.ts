export const getUrlExtension = (url: string) => {
  // biome-ignore lint/performance/useTopLevelRegex: <explanation>
  return (url.split(/[#?]/)[0].split('.').pop() || '').trim()
}
