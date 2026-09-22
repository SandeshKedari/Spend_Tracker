import { useEffect, useState } from "react";
import {
  createExpense,
  getExpenses,
  getSummary,
  updateExpense,
  deleteExpense,
  type Expense,
  type Summary,
} from "./api";
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Statistic,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Space,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./App.css";

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form] = Form.useForm();

  async function loadData() {
    try {
      const [expenseData, summaryData] = await Promise.all([
        getExpenses(),
        getSummary(),
      ]);
      setExpenses(expenseData);
      setSummary(summaryData);
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error("Failed to load data");
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const showAddModal = () => {
    form.resetFields();
    form.setFieldsValue({
      date: dayjs(),
    });
    setEditingId(null);
    setIsModalVisible(true);
  };

  const showEditModal = (expense: Expense) => {
    form.setFieldsValue({
      amount: expense.amount,
      category: expense.category,
      note: expense.note,
      date: dayjs(expense.date, "YYYY-MM-DD"),
    });
    setEditingId(expense.id);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      message.success("Expense deleted successfully");
      loadData();
    } catch (err) {
      message.error("Failed to delete expense");
    }
  };

  const handleSubmit = async (values: any) => {
    const payload = {
      amount: Number(values.amount),
      category: values.category.trim(),
      note: values.note ? values.note.trim() : "",
      date: values.date.format("YYYY-MM-DD"),
    };

    try {
      if (editingId) {
        await updateExpense(editingId, payload);
        message.success("Expense updated successfully");
      } else {
        await createExpense(payload);
        message.success("Expense added successfully");
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingId(null);
      loadData();
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message);
      } else {
        message.error("Failed to save expense");
      }
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a: Expense, b: Expense) =>
        dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
      filters: Array.from(new Set(expenses.map((e) => e.category))).map(
        (c) => ({ text: c, value: c }),
      ),
      onFilter: (value: any, record: Expense) => record.category === value,
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      render: (text: string) =>
        text ? text : <span className="text-muted">-</span>,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (val: any) => <strong>₹{Number(val).toFixed(2)}</strong>,
      sorter: (a: Expense, b: Expense) => a.amount - b.amount,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Expense) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              Modal.confirm({
                title: "Are you sure you want to delete this expense?",
                okText: "Yes",
                okType: "danger",
                cancelText: "No",
                onOk: () => handleDelete(record.id),
              });
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <Layout className="min-vh-100 bg-light">
      <Header className="bg-white shadow-sm px-4 d-flex align-items-center justify-content-between header-colorful">
        <Title level={3} className="m-0 text-white">
          ✨ Spend Tracker
        </Title>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={showAddModal}
          className="rounded-pill shadow-sm"
        >
          Add Expense
        </Button>
      </Header>

      <Content
        className="p-4"
        style={{ maxWidth: "1200px", margin: "0 auto", width: "100%" }}
      >
        {summary && (
          <Row gutter={[24, 24]} className="mb-4">
            <Col xs={24} sm={12} md={8}>
              <Card className="shadow-sm rounded-4 border-0 h-100 card-gradient-1">
                <Statistic
                  title={
                    <span className="text-white opacity-75">Total Spend</span>
                  }
                  value={summary.total_spend}
                  precision={2}
                  prefix="₹"
                  valueStyle={{ color: "#fff" }}
                  prefixCls=""
                />
              </Card>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Card className="shadow-sm rounded-4 border-0 h-100 card-gradient-2">
                <Statistic
                  title={
                    <span className="text-white opacity-75">
                      Month-over-Month
                    </span>
                  }
                  value={summary.month_over_month_change_percent ?? 0}
                  precision={2}
                  suffix="%"
                  valueStyle={{ color: "#fff" }}
                  formatter={(value) =>
                    summary.month_over_month_change_percent === null
                      ? "N/A"
                      : value
                  }
                />
              </Card>
            </Col>

            <Col xs={24} sm={24} md={8}>
              <Card className="shadow-sm rounded-4 border-0 h-100">
                <Typography.Text
                  type="secondary"
                  strong
                  className="d-block mb-3"
                >
                  Top Categories
                </Typography.Text>
                <div style={{ maxHeight: "100px", overflowY: "auto" }}>
                  {summary.spend_by_category.slice(0, 4).map((cat) => (
                    <div
                      key={cat.category}
                      className="d-flex justify-content-between mb-2"
                    >
                      <span>
                        <Tag color="cyan">{cat.category}</Tag>
                      </span>
                      <strong className="text-dark">
                        ₹{Number(cat.total).toFixed(2)}
                      </strong>
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          </Row>
        )}

        <Card className="shadow-sm rounded-4 border-0">
          <Typography.Title level={4} className="mb-4">
            All Expenses
          </Typography.Title>
          <Table
            columns={columns}
            dataSource={expenses.map((e) => ({ ...e, key: e.id }))}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
            className="custom-table"
          />
        </Card>
      </Content>

      <Modal
        title={editingId ? "✨ Update Expense" : "🌟 Add Expense"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
        className="rounded-4"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[{ required: true, message: "Please enter a valid amount" }]}
          >
            <InputNumber
              min={0.01}
              step={0.01}
              size="large"
              className="w-100 rounded-3"
              placeholder="100.00"
              prefix="₹"
            />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[
              {
                required: true,
                message: "Please enter a category",
                whitespace: true,
              },
            ]}
          >
            <Input
              size="large"
              className="rounded-3"
              placeholder="Food, Utilities, etc."
            />
          </Form.Item>

          <Form.Item name="note" label="Note">
            <Input
              size="large"
              className="rounded-3"
              placeholder="Optional details..."
            />
          </Form.Item>

          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please select a date" }]}
          >
            <DatePicker size="large" className="w-100 rounded-3" />
          </Form.Item>

          <Form.Item className="mb-0 text-end">
            <Button
              onClick={handleCancel}
              size="large"
              className="me-2 rounded-3"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              className="rounded-3 shadow-sm"
            >
              {editingId ? "Update Expense" : "Add Expense"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}

export default App;
