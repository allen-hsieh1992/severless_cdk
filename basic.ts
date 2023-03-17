class Person {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
    
    print() {
        return "Hello" + this.name;
    }
}


let person = new Person("A");
let msg:string = person.print();

console.log("msg");
