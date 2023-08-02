const target_obj = {
  message1: "hello",
  message2: "everyone",
  f: (a, b) => a + b,
};

const handler3 = {
  get(target, prop) {
    if (prop === "message2") {
      return "world";
    }
    // console.log(Reflect.get(...arguments));
    return Reflect.get(...arguments);
  },
};

const proxy3 = new Proxy(target_obj, handler3);

console.log(proxy3.message1); // hello
console.log(proxy3.message2); // world
console.log(proxy3.f(1, 3)); // 1 + 3
