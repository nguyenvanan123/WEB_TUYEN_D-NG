CREATE TABLE IF NOT EXISTS ung_tuyen (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(255),
  gioi_tinh VARCHAR(10),
  hinh_thuc VARCHAR(20),
  ngay_sinh DATE,
  cccd VARCHAR(50),
  noi_cap VARCHAR(255),
  ngay_cap DATE,
  so_dien_thoai VARCHAR(20),
  que_quan VARCHAR(255),
  cong_ty VARCHAR(255),
  ngay_nop DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- Bảng users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user'
);

-- Bảng companies
CREATE TABLE companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  description TEXT
);

-- Bảng liên kết user - company (các công ty mà user đã ứng tuyển)
CREATE TABLE applied_jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  company_id INT,
  applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);


CREATE TABLE jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ho_ten VARCHAR(100) NOT NULL,
  gioi_tinh VARCHAR(10),
  hinh_thuc VARCHAR(50),
  ngay_sinh DATE,
  cccd VARCHAR(20),
  noi_cap VARCHAR(100),
  ngay_cap DATE,
  so_dien_thoai VARCHAR(20),
  que_quan VARCHAR(100),
  cong_ty VARCHAR(150),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  job_id INT NOT NULL,
  ho_ten VARCHAR(100),
  gioi_tinh VARCHAR(10),
  hinh_thuc VARCHAR(50),
  ngay_sinh DATE,
  cccd VARCHAR(20),
  noi_cap VARCHAR(100),
  ngay_cap DATE,
  so_dien_thoai VARCHAR(20),
  que_quan VARCHAR(255),
  cong_ty VARCHAR(255),
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (job_id) REFERENCES companies(id)
);
