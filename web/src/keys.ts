/**
 * 输入法正在组字时按下的键属于输入法（选词、取消），不是给界面的命令。
 * 中文输入法里「回车」常常是「选中候选词」，这时不该另起一行、也不该跳到下一个输入框。
 * 现代浏览器用 isComposing 标记；少数浏览器在组字结束的那一下只留 keyCode 229。
 */
export function isComposing(event: { nativeEvent?: { isComposing?: boolean }; keyCode?: number }): boolean {
  return event.nativeEvent?.isComposing === true || event.keyCode === 229;
}
