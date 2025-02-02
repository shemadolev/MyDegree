// function arrayRemove(semesters, index, value) {
//     semesters[index.toString()] = semesters[index.toString()].filter((ele) => ele !== value);
//     return semesters;
// }

function includesOneOf(str, ...args) {
  return args.some((v) => str.includes(v));
}

function parseCourseLine(course, parts) {
  course["number"] = parts[0].trim();
  course["name"] = parts[1].trim();
  course["points"] = parts[2].trim();
  course["grade"] = parts[3]
    .split("-")
    .join("")
    .split("*")
    .join("")
    .replace("לא השלים", "")
    .trim();
}

export function parseStudentsSiteGrades(grades_copy) {
  grades_copy = grades_copy.split("\n");
  let raw_semesters = [[]];
  let index = 0;
  let found_first_semester = false;
  let english_exemption = false;
  let exempted_courses_part_found = false;
  let semesters = [];
  let summer_semester_indexes = [];
  let exempted_courses = [];
  for (let line of grades_copy) {
    if (found_first_semester === false) {
      if (includesOneOf(line, "אנגלית", "פטור")) {
        english_exemption = true;
      }
      if (exempted_courses_part_found) {
        if (
          !includesOneOf(
            line,
            "ציון",
            "ממוצע",
            "הצלחות",
            "לא השלים",
            'סה"כ',
            "ממוצע סמסטר",
            "הצלחות סמסטר",
            "נקודות רישום:",
            "סמסטר"
          ) &&
          line.length > 0
        ) {
          exempted_courses.push(line);
        }
      }
      if (line.includes("זיכויים")) {
        exempted_courses_part_found = true;
      }
      if (includesOneOf(line, "קיץ", "חורף", "אביב")) {
        if (line.includes("קיץ")) {
          summer_semester_indexes.push(0);
        }
        found_first_semester = true;
      }
    } else {
      if (includesOneOf(line, "קיץ", "חורף", "אביב")) {
        index += 1;
        if (line.includes("קיץ")) {
          summer_semester_indexes.push(index);
        }
        raw_semesters.push([]);
        continue;
      }
      if (
        !includesOneOf(
          line,
          "ציון",
          "ממוצע",
          "הצלחות",
          "לא השלים",
          'סה"כ',
          "ממוצע סמסטר",
          "הצלחות סמסטר",
          "נקודות רישום:"
        ) &&
        line.length > 0
      ) {
        raw_semesters[index].push(line);
      }
    }
  }
  index = 1;
  for (let rawSemester of raw_semesters) {
    let courses = [];
    if (index === 1 && exempted_courses.length > 0) {
      for (let exempted_course of exempted_courses) {
        let parts = exempted_course.split("\t");
        if (parts.length !== 4) {
          continue;
        }
        if (
          parts[3].includes("פטור עם ניקוד") &&
          !parts[1].includes("אנגלית")
        ) {
          let course = {};
          parseCourseLine(course, parts);
          courses.push(course);
        }
      }
    }
    for (let raw_line of rawSemester) {
      let course = {};
      if (raw_line.trim().length > 1) {
        let parts = raw_line.split("\t");
        if (parts.length !== 4) {
          continue;
        }
        parseCourseLine(course, parts);
        for (let already_added of courses) {
          if (already_added["name"] === course["name"]) {
            already_added["grade"] = course["grade"];
            course = null;
          }
        }
        if (course !== null) {
          courses.push(course);
        }
      }
    }
    semesters[index.toString()] = courses;
    index += 1;
  }
  return {
    semesters: semesters,
    exemption: english_exemption,
    summer_semesters_indexes: summer_semester_indexes,
  };
}

export function parseGraduateInformation(grades_copy) {
  grades_copy = grades_copy.split("\n");
  let lines = [[]];
  let index = 0;
  let found_first_sem = false;
  let english_exemption = false;
  let semesters = {};
  let summer_semester_indexes = [];
  let exempted_courses = [];
  for (let line of grades_copy) {
    if (found_first_sem === false) {
      if (line.includes("אנגלית") && line.includes("פטור")) {
        english_exemption = true;
      }
      if (line.includes("פטור עם ניקוד") && !line.includes("אנגלית")) {
        let parts = line.split("\t");
        let course = {};
        course["grade"] = parts[0]
          .split("-")
          .join("")
          .split("*")
          .join("")
          .replace("לא השלים", "")
          .trim();
        course["points"] = parts[1].trim();
        let course_full_name = parts[2].split(" ");
        course["name"] = course_full_name.slice(0, -1).join(" ").trim();
        course["number"] = course_full_name[course_full_name.length - 1].trim();

        exempted_courses.push(course);
      }
      if (
        line.includes("קיץ") ||
        line.includes("חורף") ||
        line.includes("אביב")
      ) {
        if (line.includes("קיץ")) {
          summer_semester_indexes.push(0);
        }
        found_first_sem = true;
      }
    } else {
      if (
        line.includes("קיץ") ||
        line.includes("חורף") ||
        line.includes("אביב")
      ) {
        index += 1;
        if (line.includes("קיץ")) {
          summer_semester_indexes.push(index);
        }
        lines.push([]);
        continue;
      }
      if (
        !line.includes("ציון") &&
        !line.includes("ממוצע") &&
        !line.includes("הצלחות") &&
        !line.includes("לא השלים") &&
        !line.includes('סה"כ')
      ) {
        lines[index].push(line);
      }
    }
  }
  index = 1;
  for (let semester of lines) {
    let courses = [];
    for (let line of semester) {
      let course = {};
      if (line.length > 1 && line.trim().length > 1) {
        let parts = line.split("\t");
        course["grade"] = parts[0]
          .split("-")
          .join("")
          .split("*")
          .join("")
          .replace("לא השלים", "")
          .trim();
        course["points"] = parts[1].trim();
        let course_full_name = parts[2].split(" ");
        course["name"] = course_full_name.slice(0, -1).join(" ").trim();
        course["number"] = course_full_name[course_full_name.length - 1].trim();
        for (let i = 1; i < index; i++) {
          // let to_remove_list = [];
          for (let cour of semesters[i.toString()]) {
            if (
              !cour["name"].includes("ספורט") &&
              !cour["name"].includes("חינוך") &&
              !cour["name"].includes("נבחרות")
            ) {
              // if (cour['name'] === course['name'] && course['grade'] !== '' && ((cour['grade'] !== '' && cour['grade'] !== 'לא השלים') || (course['grade'] === '' || course['grade'] === 'לא השלים'))) {
              //     to_remove_list.push(cour)
              // }
            }
          }
          // for (let rem of to_remove_list) {
          //     semesters = arrayRemove(semesters, i, rem)
          // }
        }
        for (let already_added of courses) {
          if (already_added["name"] === course["name"]) {
            already_added["grade"] = course["grade"];
            course = null;
          }
        }
        if (course !== null) {
          courses.push(course);
        }
      }
    }
    if (index === 1) {
      semesters[index.toString()] = exempted_courses.concat(courses);
    } else {
      semesters[index.toString()] = courses;
    }
    index += 1;
  }
  return {
    semesters: semesters,
    exemption: english_exemption,
    summer_semesters_indexes: summer_semester_indexes,
  };
}

export function findCourse(course_number, json_courses) {
  if (course_number.length < 3) {
    return [];
  }
  if (json_courses["courses"] !== undefined) {
    return json_courses["courses"].filter((e) =>
      e.number.includes(course_number)
    );
  } else {
    return json_courses.filter((e) => e.number.includes(course_number));
  }
}

export function parseCheeseFork(courses) {
  courses = courses.split("\n");
  let courses_from_db = [];
  let json_courses;
  if (localStorage.getItem("courses")) {
    json_courses =
      typeof localStorage.getItem("courses") === "object"
        ? localStorage.getItem("courses")
        : JSON.parse(localStorage.getItem("courses"));
    if (!json_courses.version || json_courses.version < 5.0) {
      json_courses = require("../../data/courses.json");
      localStorage.setItem("courses", JSON.stringify(json_courses));
    }
  } else {
    json_courses = require("../../data/courses.json");
    localStorage.setItem("courses", JSON.stringify(json_courses));
  }
  let j_courses = json_courses.courses;
  for (let course of courses) {
    let split = course.trim().split("-");
    if (split.length >= 2) {
      const course_number = split[0].trim();
      if (!isNaN(parseInt(course_number))) {
        let result = findCourse(course_number, j_courses);
        if (result.length > 0) {
          courses_from_db.push(result[0]);
        }
      }
    }
  }
  return courses_from_db;
}
