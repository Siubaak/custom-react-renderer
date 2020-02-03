import reconciler from 'react-reconciler';

let count = 1;
const eventListenerMap = {};
const renderer = reconciler({
  // 创建节点实例，仅仅是React Element所对应的节点实例，与实际视图相应节点不同
  createInstance(type, props) {
    // 节点实例，我们这里暂时只需要关心节点的id
    const node = { id: count++ };
    // 传递创建节点指令给宿主环境
    window.top.postMessage(['createElement', [type], cookProps(node, props)], '*');
    // 返回实例给React Reconciler
    return node;
  },
  // 创建文字节点实例，仅仅是React Element所对应的节点实例，与实际视图相应节点不同
  createTextInstance(text) {
    // 节点实例，我们这里暂时只需要关心节点的id
    const node = { id: count++ };
    // 传递创建文字节点指令给宿主环境
    window.top.postMessage(['createTextNode', [text]], '*');
    // 返回实例给React Reconciler
    return node;
  },
  // React Reconciler调度期间顶层的Ctx，用于调度期间传递必要信息给子节点，与React的Context不是同一个东西
  getRootHostContext() {
    // 因为我们不需要传递任何信息，所以这里返回一个空对象
    return {};
  },
  // React Reconciler调度期间每个节点的Ctx，用于调度期间传递必要信息给该节点的子节点，与React的Context不是同一个东西
  getChildHostContext() {
    // 因为我们不需要传递任何信息，所以这里返回一个空对象
    return {};
  },
  // 当视图准备好插入到根节点前，进行相应的准备工作，我们这里不需要任何准备工作
  prepareForCommit() { /* empty */ },
  // 当视图插入到根节点之后，进行相应的清理工作，我们这里不需要任何清理工作
  resetAfterCommit() { /* empty */ },
  // 用于判断当前节点是否需要直接设置内部文字，而不在节点内创建任何子节点
  // 常用于像textarea等标签，以及有dangerouslySetInnerHTML属性的节点
  shouldSetTextContent() {
    // 我们这里不考虑特殊情况，均返回false，即任何节点都不需要直接设置文字并继续创建子节点
    return false;
  },
  // 宿主环境是否支持节点变更，即是否支持类似于appendChild、insertBefore、removeChild的方法
  supportsMutation: true,
  // 用于节点首次插入子节点后，是否需要在所有子节点完成插入后，调用commitMount钩子
  // 对于ReactDOM，这里主要用于标签的autofocus；对于React Native，这里直接就返回了false
  finalizeInitialChildren() {
    // 我们这里不考虑autofocus的情况，均返回false
    return false;
  },
  // 插入子节点到根节点下
  appendChildToContainer(node, child) {
    // 传递插入节点指令给宿主环境
    window.top.postMessage(['appendChild', [0, child.id]], '*');
  },
  // 首次渲染插入子节点
  appendInitialChild(parent, child) {
    // 传递插入节点指令给宿主环境
    window.top.postMessage(['appendChild', [parent.id, child.id]], '*');
  },
  // 插入子节点
  appendChild(parent, child) {
    // 传递插入节点指令给宿主环境
    window.top.postMessage(['appendChild', [parent.id, child.id]], '*');
  },
  // 告诉React Reconciler该节点实例是否需要更新，通常需要对节点类型和属性进行对比
  prepareUpdate() {
    // 我们这里简单处理，都需要更新
    return true;
  },
  // 当所有节点更新收集完成后，提交该节点更新
  commitUpdate(node, updatePayload, type, oldProps, newProps) {
    // 传递更新节点指令给宿主环境
    window.top.postMessage(['updateElement', [node.id], cookProps(node, newProps)], '*');
  },
  // 当所有节点更新收集完成后，提交该文字节点更新
  commitTextUpdate(node, oldText, newText) {
    // 传递更新文字节点指令给宿主环境
    window.top.postMessage(['updateTextNode', [node.id, newText]], '*');
  },
  // 插入子节点到根节点下某个子节点前
  insertInContainerBefore(node, child, beforeChild) {
    // 传递在某节点前插入节点指令给宿主环境
    window.top.postMessage(['insertBefore', [0, child.id, beforeChild.id]], '*');
  },
  // 插入子节点到父节点下某个子节点前
  insertBefore(parent, child, beforeChild) {
    // 传递在某节点前插入节点指令给宿主环境
    window.top.postMessage(['insertBefore', [parent.id, child.id, beforeChild.id]], '*');
  },
  // 从根节点上移除某个子节点
  removeChildFromContainer(node, child) {
    // 传递移除节点指令给宿主环境
    window.top.postMessage(['removeChild', [0, child.id]], '*');
  },
  // 从父节点上移除某个子节点
  removeChild(parent, child) {
    // 传递移除节点指令给宿主环境
    window.top.postMessage(['removeChild', [parent.id, child.id]], '*');
  },
});

let container = null;
const Coolboy = {
  render(elements, root, callback) {
    if (!container) {
      container = renderer.createContainer(root, false, false);
    }
    renderer.updateContainer(elements, container, null, callback);
  }
}

export default Coolboy;

// 处理属性
function cookProps(node, rawProps) {
  const props = {};
  Object.keys(rawProps).forEach((key) => {
    const rawVal = rawProps[key];
    if (typeof rawVal === 'function') {
      if (key.startsWith('on')) {
        // 如果是函数，而且以on开头，就转换一下
        const lowerKey = key.toLowerCase();
        const callbackId = `callback_${node.id}_${lowerKey}`;
        eventListenerMap[callbackId] = rawVal;
        props[lowerKey] = callbackId;
      }
    } else if (key === 'children') {
      // 如果是children，跳过
    } else {
      // 其余的都直接赋值
      props[key] = rawVal;
    }
  });
  return props;
}

// 处理事件监听
window.addEventListener('message', e => {
  const callback = eventListenerMap[e.data];
  typeof callback === 'function' && callback();
});