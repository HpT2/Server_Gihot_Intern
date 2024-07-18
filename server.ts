class t1{
    print(){
      console.log("t1");
    }
  }
  
  class t2 extends t1 {
    print() {
      console.log("t2");
    }
  }
  
  class t3 extends t1 {
    
  }
  
  let eventList : any = {
    0 : t1,
    1 : t2,
    2 : t3,
  }

  let r : number = Math.floor(Math.random() * Object.keys(eventList).length);
  console.log(r);
  let c = new (eventList[r])();
  c.print();